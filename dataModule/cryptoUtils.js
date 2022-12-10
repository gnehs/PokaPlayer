
const jsonfile = require('jsonfile')
const crypto = require('crypto')
const config = jsonfile.readFileSync("./config.json")
const { sessionSecret } = config.PokaPlayer

const decodeBase64 = x => Buffer.from(x, "base64url").toString("utf8");
const encodeBase64 = x => Buffer.from(x).toString("base64url");
function genHash(str) {
  const hash = crypto.createHash('sha256')
  hash.update(str.toString() + sessionSecret, 'utf8')
  return hash.digest('hex').slice(0, 8)
}
function encodeURL(url) {
  return encodeBase64(JSON.stringify([url, genHash(url)]))
}
function decodeURL(str) {
  let [url, hash] = JSON.parse(decodeBase64(str))
  if (genHash(url) == hash) {
    return url
  } else {
    return false
  }
}
module.exports = {
  encodeURL,
  decodeURL
}
