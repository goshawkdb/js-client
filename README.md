# goshawkdb

A JavaScript client for GoshawkDB that works in node or the browser.

Dev only links:
* [Doc](https://goshawkdb.github.io/js-client/)
* [Explorer](https://rawgit.com/goshawkdb/visualizer/master/index.html)
* Script tag: `<script type="text/javascript" src="https://goshawkdb.github.io/js-client/goshawkdb.browser.js"></script>`

## Notes for getting Started

Run a GoshawkDB server with the config found in `example/env`.  See the [goshawkdb documentation](https://goshawkdb.io/documentation.html).

When running in the browser, you currently need to import the
certificates for your user.  You can test that you've done this
correctly by going
to [https://localhost:7895/ws](https://localhost:7895/).  If it's
working, it will say 'GoshawkDB Server version dev. Websocket
available at /ws'.

To see the web example

```
npm run start
```

And navigate to http://localhost:8080/example/

The specific example code assumes that your database has a root object
with two references to other objects.

To see the node example

```
node example/node-example.js
```

## Setup

### In Node

Import the GoshawkDB client

```bash
npm install --save goshawkdb
```

When running in node, I suggest the following in your code:

```js
// Doesn't log at debug level as it's pretty noisy.  I'll need a proper logging solution soon...
global.console.debug = () => {}
// global.console.debug = global.console.log

// Make console.log of objects use colours.  Pretty
if (process.stdout.isTTY) {
	require('util').inspect.defaultOptions.colors = true
}
```

Get a `goshawkdb` reference and open a connection:

```js
const goshawkdb = require('goshawkdb')

// These will need to be for a user that your goshawkdb configuration allows.
// Check the .pem file you created for that user.
const connectionOptions = {
	rejectUnauthorized: true,
	cert: `-----BEGIN CERTIFICATE-----
MIIBszCCAVmgAwIBAgIIfOmxD9dF8ZMwCgYIKoZIzj0EAwIwOjESMBAGA1UEChMJ
R29zaGF3a0RCMSQwIgYDVQQDExtDbHVzdGVyIENBIFJvb3QgQ2VydGlmaWNhdGUw
IBcNMTYwMTAzMDkwODUwWhgPMjIxNjAxMDMwOTA4NTBaMBQxEjAQBgNVBAoTCUdv
c2hhd2tEQjBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABFrAPcdlw5DWQmS9mCFX
FlD6R8ABaBf4LA821wVmPa9tiM6n8vRJvbmHuSjy8LwJJRRjo9GJq7KD6ZmsK9P9
sXijbTBrMA4GA1UdDwEB/wQEAwIHgDATBgNVHSUEDDAKBggrBgEFBQcDAjAMBgNV
HRMBAf8EAjAAMBkGA1UdDgQSBBBX9qcbG4ofUoUTHGwOgGvFMBsGA1UdIwQUMBKA
EL9sxrcr6QTwwk5csm2ZcfgwCgYIKoZIzj0EAwIDSAAwRQIgOK9PVJt7KdvDU/9v
z9gQI8JnVLZm+6gsh6ro9WnaZ8YCIQDXhjfQAWaUmJNTgKq3rLHiEbPS4Mxl7h7S
kbkX/2GIjg==
-----END CERTIFICATE-----`,
	key: `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIN9Mf6CzDgCs1EbzJqDK3+12wcr7Ua3Huz6qNhyXCrS1oAoGCCqGSM49
AwEHoUQDQgAEWsA9x2XDkNZCZL2YIVcWUPpHwAFoF/gsDzbXBWY9r22Izqfy9Em9
uYe5KPLwvAklFGOj0YmrsoPpmawr0/2xeA==
-----END EC PRIVATE KEY-----`
	ca: `-----BEGIN CERTIFICATE-----
MIIBxzCCAW2gAwIBAgIIQqu37k6KPOIwCgYIKoZIzj0EAwIwOjESMBAGA1UEChMJ
R29zaGF3a0RCMSQwIgYDVQQDExtDbHVzdGVyIENBIFJvb3QgQ2VydGlmaWNhdGUw
IBcNMTYwMTAzMDkwODE2WhgPMjIxNjAxMDMwOTA4MTZaMDoxEjAQBgNVBAoTCUdv
c2hhd2tEQjEkMCIGA1UEAxMbQ2x1c3RlciBDQSBSb290IENlcnRpZmljYXRlMFkw
EwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEjHBXt+0n477zVZHTsGgu9rLYzNz/WMLm
l7/KC5v2nx+RC9yfkyfBKq8jJk3KYoB/YJ7s8BH0T456/+nRQIUo7qNbMFkwDgYD
VR0PAQH/BAQDAgIEMA8GA1UdEwEB/wQFMAMBAf8wGQYDVR0OBBIEEL9sxrcr6QTw
wk5csm2ZcfgwGwYDVR0jBBQwEoAQv2zGtyvpBPDCTlyybZlx+DAKBggqhkjOPQQD
AgNIADBFAiAy9NW3zE1ACYDWcp+qeTjQOfEtED3c/LKIXhrbzg2N/QIhANLb4crz
9ENxIifhZcJ/S2lqf49xZZS91dLF4x5ApKci
-----END CERTIFICATE-----`
}

goshawkdb.connect("wss://localhost:7895/ws", connectionOptions).then((connection) => {

    // this is where your goshawkdb code goes

})
```

### In the browser

The configuration of keys and certificates must be done in whatever way your browser
and operating system support.

Check that it has worked by navigating to [https://localhost:7895/](https://localhost:7895/).
If it's working, it will say 'GoshawkDB Server version dev. Websocket available at /ws'.

Include the client:

```html
<script type="text/javascript" src="https://goshawkdb.github.io/js-client/goshawkdb.browser.js"></script>
```

The file `goshawkdb.browser.js` is located in the dist subfolder of this module.
It is regenerated on an `npm build`.

Now include your code, e.g.

```js
goshawksb.connect("wss://localhost:7895/ws").then((connection) => {

    // this is where your goshawkdb code goes

})
```

### Connection API

A connection allows you to submit transactions.  Only one transaction is ever active at a time, calling `transact` while
another transaction is active will cause your new transaction to be queued.

```js
const promiseOfSomething = connection.transact((txn) => {

	// transaction code

    return something
})
```

### Transaction API

**NOTE**: code submitted to `.transact` may be run by the system multiple times. Avoid making side effecting changes
from inside a transaction.  The goshawksb library uses exceptions to stop execution when there is a cache miss and it
needs to request values from the server.  If you use try catch around transaction methods and you want this behaviour
to work, you will need to rethrow any exceptions with a name of `TransactionRetryNeeded` that you inadvertantly catch.

Inside a transaction you can access references to the configured root objects:

```js
const rootRef = txn.roots['myRoot']
```

You can read the value and references of an object via a reference to that object.

```js
const {value, refs} = txn.read(rootRef)
```

Values are ArrayBuffers while `refs` is an array of Reference ojects.

To write to an object you call `txn.write`.  This example code loads the first reference from
the root object (assuming it refers to some object), then sets the value and adds a reference back to the root object.

```js
const otherObjRef = refs[0]
const otherRefs = txn.read(otherObjRef).refs
txn.write(otherObjRef, Buffer.from("hello"), otherRefs.concat(rootRef))
```

Values can be buffers (in node), typed arrays or arraybuffers.

You can create an object too with

```js
const newRef = txn.create(Buffer.from("thing"), [])
```

If you want to be notified when something changes, you can create a transaction that reads the values you're interested
in and then calls `txn.retry()`.  This will cause the transaction to stop processing until the values change, at which
point the transaction will be run again.

If you want to check that references point to the same object, you can do this with `if (ref.sameReferent(otherRef))`.
