const msgpack = require("msgpack-lite/dist/msgpack.min.js")
const WebSocket = require("ws")
const goshawkdb = require("./goshawkdb")
const { noop } = require("./utils")

/**
 * The websocket and Msgpack connection.
 * @private
 */
class MsgpackConnection {
	constructor(url, connectionLabel = "") {
		this.url = url
		// connectionLabel is used for logging.
		this.connectionLabel = connectionLabel
		this.websocket = null
		this.options = {
			codec: msgpack.createCodec({ binarraybuffer: true })
		}
		// all the callbacks!
		this.onOpen = noop
		this.onEnd = noop
		this.onMessage = noop
		this.onClose = noop
		this.onError = noop
	}

	connect(onMessage, onEnd, onOpen, connectionOptions) {
		connectionOptions = connectionOptions || {}
		connectionOptions.ciphers = "ECDHE-ECDSA-AES128-GCM-SHA256"
		this.onMessage = onMessage
		// onEnd triggers before either onEnd or onClose and indicates that the connection has ended.
		this.onEnd = onEnd
		this.onOpen = onOpen

		goshawkdb.logger.info(
			"Connection %s: Connecting to %s",
			this.connectionLabel,
			this.url
		)
		const websocket = (this.websocket = new WebSocket(
			this.url,
			undefined,
			connectionOptions
		))
		Object.assign(websocket, {
			binaryType: "arraybuffer",
			onopen: evt => {
				goshawkdb.logger.debug(
					"Connection %s: Connection Open",
					this.connectionLabel
				)
				this.onOpen(evt)
			},
			onclose: evt => {
				goshawkdb.logger.debug(
					"Connection %s: Connection Closed",
					this.connectionLabel,
					evt.code,
					evt.reason
				)
				this.onEnd(evt)
				this.onClose(evt)
			},
			onerror: evt => {
				goshawkdb.logger.error(
					"Connection %s: Connection Error",
					this.connectionLabel,
					evt.code,
					evt.reason
				)
				this.onEnd(evt)
				this.onError(evt)
			},
			onmessage: messageEvent => {
				const data = msgpack.decode(new Uint8Array(messageEvent.data))
				goshawkdb.logger.debug("%s <", this.connectionLabel, data)
				this.onMessage(data)
			}
		})
	}

	send(message) {
		goshawkdb.logger.debug("%s >", this.connectionLabel, message)
		this.websocket.send(msgpack.encode(message, this.options))
	}

	// sends a message, and returns a promise which resolves with the next message back from the server. This helps
	// make a request/response pattern easy.  It replaces onMessage and onEnd until it receives the message.
	request(message) {
		const oldHandler = this.onMessage
		const oldEndHandler = this.onEnd
		return new Promise((resolve, reject) => {
			this.onMessage = msg => {
				resolve(msg)
				this.onMessage = oldHandler
				this.onEnd = oldEndHandler
			}
			this.onEnd = evt => {
				this.onMessage = oldHandler
				this.onEnd = oldEndHandler
				reject(evt)
				if (oldEndHandler) {
					oldEndHandler(evt)
				}
			}
			if (message) {
				this.send(message)
			}
		})
	}

	close() {
		this.websocket.close()
	}
}

module.exports = MsgpackConnection
