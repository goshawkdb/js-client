const MsgpackConnection = require("./msgpack-connection")
const Uint64 = require("./uint64")
const Transaction = require("./transaction")
const Ref = require("./ref")
const { TransactionRetryNeeded, TransactionRejectedError } = require("./errors")
const ObjectCache = require("./objectcache")
const { binaryToHex, asPromise } = require("./utils")
const goshawkdb = require("./goshawkdb")

let nextConnectionNumber = 0
function connectionLabel(connectionId) {
	return ("000" + connectionId).substr(-3)
}

/**
 * A Connection represents the connection to the GoshawkDB.
 *
 * They should be acquired through the static {@link GoshawkDb.connect} function.
 */
class Connection {
	/** @private */
	constructor(url) {
		/** @private used in logging to distinguish different connections */
		this.connectionId = connectionLabel(nextConnectionNumber++)
		/** @private */
		this.link = new MsgpackConnection(url, this.connectionId)

		/**
		 * The product and version information we sent to the server during the initial connection handshake.
		 * @type {{Product: string, Version: string}}
		 */
		this.clientInfo = { Product: "GoshawkDB", Version: "dev" }

		/**
		 * The product and version information we receive from the server during the initial handshake.
		 * Will always be set after the promise returned by connect has resolved successfully.  May be null otherwise.
		 * @type {?{Product: string, Version: string}}
		 */
		this.serverInfo = null

		/**
		 * The namespace that the server assigns to this client.
		 * Will always be set after the promise returned by connect has resolved successfully.  May be null otherwise.
		 * @type {?ArrayBuffer}
		 */
		this.namespace = null

		/**
		 * The roots that this client has access to.
		 * Provided by the server during handshake.
		 * Will always be set after the promise returned by connect has resolved successfully.  May be empty otherwise.
		 * @type {{string: Ref}}
		 */
		this.roots = {}

		/** @private the top level cache that stores all the values and refs for objects the client knows about. */
		this.cache = null

		// we control the first 8 bytes of transaction ids and new object ids (used during creation).
		// the namespace is appended to them when actually sent to the server.  We can't use normal js
		// numbers as javascript doesn't support 64 integers.  The only actual operation we need is 'increment'.
		/** @private */
		this.nextTransactionId = Uint64.from(0, 0, 0, 0, 0, 0, 0, 0)

		/** @private the queue of transactions.*/
		this.transactions = []
		/** @private the transaction currently being processed.*/
		this.currentTransaction = null
		/** @private the timeout handle or null if no timeout to process a transaction is waiting*/
		this.scheduledCallback = null
	}

	/**
	 * Connects to the server.  If running in node, you will need to provide connectionOptions that include the client
	 * certificate and key.
	 *
	 * @return {Promise<Connection, Error>}
	 */
	connect(connectionOptions) {
		return new Promise((resolve, reject) => {
			goshawkdb.logger.info(
				"Connection %s: %s version %s",
				this.connectionId,
				this.clientInfo.Product,
				this.clientInfo.Version
			)
			this.link.connect(
				message => {
					goshawkdb.logger.warn(
						`Connection %s: No handler found for message`,
						this.connectionId,
						message
					)
				},
				reject,
				() => {
					this.link
						.request(this.clientInfo)
						.then(message => {
							this.serverInfo = message
							if (
								this.serverInfo.Product !== this.clientInfo.Product ||
								this.serverInfo.Version !== this.clientInfo.Version
							) {
								goshawkdb.logger.warn(
									"Connection %s: Version mismatch.  Server reported product %s, version %s",
									this.connectionId,
									this.serverInfo.Product,
									this.serverInfo.Version
								)
							}
							return this.link.request()
						})
						.then(message => {
							// populate the roots
							this.roots = {}
							for (const root of message.Roots) {
								this.roots[root.Name] = Ref.fromMessage(root)
							}
							// set the namespace
							this.namespace = message.Namespace

							// now we're properly connected
							this.cache = new ObjectCache(this.namespace)
							goshawkdb.logger.info(
								"Connection %s: Connected to goshawkdb.",
								this.connectionId,
								this.serverInfo,
								this.clientInfo,
								this.namespace,
								this.roots
							)
							return this
						})
						.then(resolve, reject)
				},
				connectionOptions
			)
		})
	}

	/**
	 * Queues a transaction for running, then ensures that transaction processing is happening.
	 * The returned promise resolves with the value returned by the fn once the transaction has committed.  The fn may be
	 * run multiple times and so should avoid side effects.
	 * fn may be an asynchronous or a synchronous function.
	 *
	 * @param {function(txn:Transaction):{*|Promise<*,Error>}} txnFn the transaction function.  This function may be run multiple times and should rethrow any TransactionRetryNeeded exceptions.
	 * @returns {Promise<*,Error>} a promise that resolves to the result of the transaction function once the transaction submits or an error if it cannot.
	 */
	transact(txnFn) {
		if (txnFn instanceof Function === false) {
			throw new TypeError(
				`Connection ${
					this.connectionId
				}: Transaction argument must be a function, was ${String(txnFn)}`
			)
		}

		return new Promise((resolve, reject) => {
			this.transactions.push(
				new Transaction(
					txnFn,
					{ onSuccess: resolve, onFail: reject },
					this.roots,
					this.namespace,
					this.cache
				)
			)
			this.scheduleNextTransaction(false)
		})
	}

	/**
	 * Closes the underlying link.
	 */
	close() {
		this.link.close()
	}

	// private api

	/** @private
	 * Actually runs the next queued transaction.
	 */
	executeNextTransaction() {
		if (this.currentTransaction != null) {
			// we're currently processing a transaction, exit without doing anything.
			return
		}

		const currentTransaction = (this.currentTransaction = this.transactions.shift())
		const txnIdWithNamespace = this.nextTransactionId.concat(this.namespace)

		const succeed = (finalId, transactionResult) => {
			if (finalId) {
				currentTransaction.promoteCache(finalId)
			}
			currentTransaction.onSuccess(transactionResult)
			this.scheduleNextTransaction(true)
		}
		const retry = () => {
			currentTransaction.reset()
			this.transactions.unshift(currentTransaction)
			this.scheduleNextTransaction(true)
		}
		const fail = err => {
			currentTransaction.onFail(err)
			this.scheduleNextTransaction(true)
		}
		const sendTransaction = result => {
			const transactionMessage = currentTransaction.toMessage(
				txnIdWithNamespace
			)
			if (transactionMessage.ClientTxnSubmission.Actions.length > 0) {
				this.link
					.request(transactionMessage)
					.then(response => {
						this.updateFromTransactionResponse(response)
						const outcome = response.ClientTxnOutcome
						if (outcome.Commit) {
							succeed(outcome.FinalId, result)
						} else if (outcome.Error != "") {
							fail(new TransactionRejectedError(outcome.Error))
						} else if (outcome.Abort) {
							retry()
						} else {
							fail("Unknown response message " + JSON.stringify(outcome))
						}
					})
					.catch(fail)
			} else {
				succeed(undefined, result)
			}
		}

		// we use asPromise, since the result of running fn might be a Promise.
		asPromise(() => {
			return currentTransaction.fn(currentTransaction)
		})
			.catch(e => {
				if (e instanceof TransactionRetryNeeded === false) {
					throw e
				}
			})
			.then(sendTransaction, fail)
	}

	/** @private
	 * Updates the top level connection cache and counters based on a response from the server.
	 * @param response the msgpack response.
	 */
	updateFromTransactionResponse(response) {
		// Responses contain a final transaction id.  We take the first 8 bytes and increment it.
		this.nextTransactionId = Uint64.fromBinary(
			response.ClientTxnOutcome.FinalId
		).inc()
		// If we received an Abort message, then we may also have received some cache update instructions.
		if (response.ClientTxnOutcome.Abort) {
			for (let update of response.ClientTxnOutcome.Abort) {
				const id = update.VarId
				if (update.ActionType === 4) {
					goshawkdb.logger.debug(
						`Connection ${this.connectionId}: Removing ${binaryToHex(
							id
						)} from cache.`
					)
					this.cache.remove(id)
				} else {
					if (update.ActionType === 0 || update.ActionType === 2) {
						const writeData = update.Modified
						this.cache
							.get(id)
							.update(
								writeData.Value.buffer,
								writeData.References.map(Ref.fromMessage)
							)
					}
				}
			}
		}
	}

	/** @private
	 * If there is no transaction currently processing and we haven't scheduled one
	 * and there is a transaction waiting to be processed, then schedule it.
	 * @param {boolean} clearCurrentTransaction if true, this will first clear the current transaction.
	 */
	scheduleNextTransaction(clearCurrentTransaction) {
		if (clearCurrentTransaction) {
			this.currentTransaction = null
		}
		if (
			this.scheduledCallback == null &&
			this.currentTransaction == null &&
			this.transactions.length > 0
		) {
			this.scheduledCallback = setTimeout(() => {
				this.scheduledCallback = null
				this.executeNextTransaction()
			}, 0)
		}
	}
}

module.exports = Connection
