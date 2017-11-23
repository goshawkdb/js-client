const { noop } = require("./utils")

/** @private */
const ConsoleLogger = Object.create(console, {
	debug: {
		enumerable: true,
		writable: true,
		value: console.debug
			? console.debug.bind(console)
			: console.log.bind(console)
	}
})

/* @privatae */
const NullLogger = { error: noop, warn: noop, info: noop, debug: noop }

/**
 * Goshawkdb entry point
 *
 * @type {{logger: console, connect: (function(string, *): Promise.<Connection, Error>)}}
 */
class Goshawkdb {
	/** @private */
	constructor() {
		/**
		 * The logger used by the goshawkdb client.  Defaults to the ConsoleLogger.
		 *
		 * You can customise the logger by setting this.  Whatever you set it to must support debug, info, warn and
		 * error methods, %s interpolation and the display of multiple arguments.  `console` in
		 * browsers meets these criteria, while in node it must have a debug method added.
		 *
		 * By default, it will be set to the console logger.
		 *
		 * @type {Object}
		 * @property {function} logger.debug Outputs log messages at debug level. Should support %s interpolation.
		 * @property {function} logger.info Outputs log messages at info level. Should support %s interpolation.
		 * @property {function} logger.warn Outputs log messages at warn level. Should support %s interpolation.
		 * @property {function} logger.error Outputs log messages at error level. Should support %s interpolation.
		 */
		this.logger = ConsoleLogger

		/**
		 * ConsoleLogger logs to console.
		 */
		this.ConsoleLogger = ConsoleLogger

		/**
		 * NullLogger doesn't log at all
		 */
		this.NullLogger = NullLogger
	}

	/**
	 * Connects to the websocket port of a goshawkdb server.
	 * See the [goshawkdb documentation](https://goshawkdb.io/documentation.html) for more information.
	 *
	 * @param {string} url the url of the websocket endpoint. e.g. wss://localhost:7895/ws
	 * @param {*} connectionOptions in node.js, the connection options are used to make the connection.
	 * 				They are for the WS module and are defined [here](https://github.com/websockets/ws/blob/master/doc/ws.md).
	 * 				The options should include `key`, `cert` and if you don't want it to check
	 * 				the server certificates, `{rejectUnauthorized: false}`. It is recommended
	 * 				to check the server identity by setting `{rejectUnauthorized: true}` and
	 * 				providing the server cluster cerificate as a string in PEM format in
	 * 				`options.ca`.
	 * @return {Promise<Connection, Error>} A promise that resolves with a connection or rejects with an error.
	 */
	connect(url, connectionOptions) {
		const Connection = require("./connection")
		return new Connection(url).connect(connectionOptions)
	}
}

module.exports = new Goshawkdb()