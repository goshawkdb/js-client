/*
 * This example connects to a goshawk wssPort running on localhost:7895 and reads the value of the 'test' root.
 * Then it overwrites the value on the 'test' root to 'Boo!'.
 */
const goshawkdb = require('..')

// The cert and key should be taken from the .pem file for the user you wish to connect as.
// The user should also have a root called 'test' for the rest of the test to work.  You can
// see the example/env folder for an example configuration.
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
-----END EC PRIVATE KEY-----`,
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
	return connection.transact((txn) => {
		const testRootRef = txn.root('test')
		const root = txn.read(testRootRef)
		console.log("test root contains", root.value, root.refs)
		txn.write(testRootRef, Buffer.from("Boo!"), root.refs)
	}).then(
		() => {
			console.log('transaction committed')
			connection.close()
		}, (e) => {
			console.log('transaction failed because', e)
			connection.close()
		}
	)
}).then(() => console.log('done'), (err) => {console.error('connection problem', err)})
