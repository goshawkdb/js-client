const Connection = require("./connection")

function noop() {}

exports.ConsoleLogger = Object.create(console, {
	debug: {
		enumerable: true,
		writable: true,
		value: console.debug ? console.debug.bind(console) : () => {}
	}
})

exports.NullLogger = { error: noop, warn: noop, info: noop, debug: noop }

/**
 * The logger used by the goshawkdb client.
 *
 * Must support debug, info, warn and error, %s interpolation and the display of multiple arguments.  console in
 * browsers meets these criteria, while in node it must have a debug method added.  By default this is done for you.
 *
 * @property {*}
 */
exports.logger = exports.ConsoleLogger

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
exports.connect = function connect(url, connectionOptions) {
	return new Connection(url).connect(connectionOptions)
}
