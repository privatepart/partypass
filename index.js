////////////////////////////////////////////////////////////////////////////
//
//    const pass = new Partypass({
//      host: "http://localhost:3000",
//      key: privKey
//    })
//    let session = await pass.create("user")
//
//    const pass = new Partypass({
//      host: "http://localhost:3000",
//      key: privKey
//    })
//    let built = await pass.build("user")
//    let session = await pass.request(built)
//
////////////////////////////////////////////////////////////////////////////
const sigUtil = require('@metamask/eth-sig-util')
const { privateToAddress } = require('@ethereumjs/util')
const fetch = require('cross-fetch')
class Partypass {
  constructor(o) {
    this.host = o.host
    this.key = o.key
    this.account = "0x" + privateToAddress(Buffer.from(this.key, "hex")).toString("hex")
  }
  async session(name) {
    const url = await this.path(name, "session")
    const r = await fetch(this.host + url).then((r) => { return r.json() })
    return r[name]
  }
  async build(name) {
    const now = Date.now()
    const url = await this.path(name, "connect")
    const str = `authenticating ${this.account} at ${now} with nonce ${this.csrfToken}`
    const sig = await this.sign(str)
    return { str, sig, url }
  }
  async request({ str, sig, url }, payload) {
    const r = await fetch(this.host + url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'CSRF-Token': this.csrfToken,
      },
      body: JSON.stringify({ str, sig, payload })
    }).then((res) => {
      if(res.ok) {
        return res.json()
      } else {
        return res.json().then((json) => {
          throw new Error(json.error)
        })
      }
    })
    this.parties = null
    this.csrfToken = null
    return r
  }
  async create(name, payload) {
    const x = await this.build(name)
    const r = await this.request(x, payload)
    return r
  }
  async party(name) {
    if (!this.parties) {
      let r = await fetch(this.host + "/privateparty").then(r => r.json())
      this.parties = r.parties
      this.csrfToken = r.csrfToken
    }
    if (name) {
      return this.parties[name]
    } else {
      return this.parties
    }
  }
  async path(name, pathName) {
    const p = await this.party(name)
    return p[pathName]
  }
  sign (str) {
    const result = sigUtil.personalSign({
      data: Buffer.from(str),
      privateKey: Buffer.from(this.key, "hex")
    })
    return result
  }
}
module.exports = Partypass
