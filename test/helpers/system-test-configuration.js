const fs = require("fs")
const path = require("path")
require("./debug")

const pemSplitRegex = /-----BEGIN ([^-]+)-----\n([^-]+)\n-----END ([^-]+)-----/gm

function loadPem(filePath) {
	const result = {}
	const contents = fs.readFileSync(filePath)
	let match
	while ((match = pemSplitRegex.exec(contents)) !== null) {
		if (match[1] !== match[3]) {
			throw new Error(
				`Begin and end tags did not match: begin=${match[1]} end=${match[3]}`
			)
		}
		result[match[1]] = match[2]
	}
	return result
}

let clientKeyPath = path.join(__dirname, ".", "user1.pem")
if (process.env.GOSHAWKDB_DEFAULT_CLIENT_KEYPAIR) {
	clientKeyPath = process.env.GOSHAWKDB_DEFAULT_CLIENT_KEYPAIR
}

let clusterCertPath = path.join(__dirname, ".", "clusterCert.pem")
if (process.env.GOSHAWKDB_DEFAULT_CLUSTER_CERT) {
	clusterCertPath = process.env.GOSHAWKDB_DEFAULT_CLUSTER_CERT
}

const clusterHosts =
	process.env.GOSHAWKDB_DEFAULT_CLUSTER_HOSTS_WSS || "localhost:7895;"
const [firstHost, firstPort = 7895] = clusterHosts.split(";")[0].split(":")

const pemFile = loadPem(clientKeyPath)

module.exports = {
	host: firstHost,
	port: firstPort,
	root: process.env.GOSHAWKDB_ROOT_NAME || "test",
	rejectUnauthorized: true,
	cert: `-----BEGIN CERTIFICATE-----\n${
		pemFile["CERTIFICATE"]
	}\n-----END CERTIFICATE-----`,
	key: `-----BEGIN EC PRIVATE KEY-----\n${
		pemFile["EC PRIVATE KEY"]
	}\n-----END EC PRIVATE KEY-----`,
	ca: fs.readFileSync(clusterCertPath)
}

console.log(
	"Using client configuration from",
	clientKeyPath,
	":",
	module.exports
)
