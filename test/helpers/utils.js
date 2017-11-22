const connectionOptions = require("./system-test-configuration")
const goshawkdb = require("../..")

function transactionMustFail(error, test) {
	return t => {
		return new Promise((resolve, reject) => {
			goshawkdb
				.connect(
					`wss://${connectionOptions.host}:${connectionOptions.port}/ws`,
					connectionOptions
				)
				.then(conn => {
					return conn
						.transact(txn => {
							return test(t, conn, txn)
						})
						.then(reject, err => {
							if (err instanceof error) {
								resolve()
							} else {
								reject(err)
							}
						})
				})
				.catch(reject)
		})
	}
}

function all(...tests) {
	return t => {
		const testPromises = tests.map(test => test(t))
		return Promise.all(testPromises)
	}
}

function transactionTest(test) {
	return t => {
		return new Promise((resolve, reject) => {
			goshawkdb
				.connect(
					`wss://${connectionOptions.host}:${connectionOptions.port}/ws`,
					connectionOptions
				)
				.then(conn => {
					return conn
						.transact(txn => {
							return Promise.resolve(test(t, conn, txn))
						})
						.then(resolve, reject)
				})
				.catch(reject)
		})
	}
}

function setupThenTest(preparation, ...tests) {
	return t => {
		return preparation(t).then(() => {
			return Promise.all(
				tests.map(test => {
					try {
						return Promise.resolve(test(t))
					} catch (e) {
						return Promise.reject(e)
					}
				})
			)
		})
	}
}

function setupThenTransactionTest(setup, test) {
	return t => {
		return new Promise((resolve, reject) => {
			let connection = null
			goshawkdb
				.connect(
					`wss://${connectionOptions.host}:${connectionOptions.port}/ws`,
					connectionOptions
				)
				.then(conn => {
					connection = conn
					connection
						.transact(txn => {
							setup(t, conn, txn)
						})
						.then(() => {
							return connection.transact(txn => {
								return test(t, conn, txn)
							})
						}, reject)
						.then(resolve, reject)
				}, reject)
		})
	}
}

function connectionTest(test) {
	return t => {
		return new Promise((resolve, reject) => {
			goshawkdb
				.connect(
					`wss://${connectionOptions.host}:${connectionOptions.port}/ws`,
					connectionOptions
				)
				.then(conn => {
					try {
						return Promise.resolve(test(t, conn))
					} catch (e) {
						return Promise.reject(e)
					}
				})
				.then(resolve, reject)
		})
	}
}

exports.connectionTest = connectionTest
exports.connectionOptions = connectionOptions
exports.testRootName = connectionOptions.root
exports.setupThenTransactionTest = setupThenTransactionTest
exports.transactionTest = transactionTest
exports.transactionMustFail = transactionMustFail
exports.all = all
exports.setupThenTest = setupThenTest
