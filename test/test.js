require('dotenv').config()
const fetch = require('cross-fetch')
const assert = require('assert')
const Server = require('privateparty')
const Partypass = require('../index')
var s, p;
const pass = new Partypass({
  key: process.env.KEY,
  host: "http://localhost:3000"
})
const launch = () => {
  p = new Server();
  p.add("admin")
  p.app.get("/api", p.protect("admin", { json: { error: "not admin" } }), (req, res) => {
    res.json({ success: true })
  })
  s = p.app.listen(3000)
}
describe("test", () => {
  beforeEach(async () => {
    if (s) {
      await new Promise((resolve, reject) => {
        s.close(() => {
          resolve()
        })
      })
    }
    launch()
  })
  it("connect creates a jwt and returns jwt, account, and expiresIn", async () => {
    let r = await pass.create("admin")
    assert.ok(r)
    assert.ok(r.account)
    assert.ok(r.expiresIn)
    assert.ok(r.jwt)
  })
  it("token authentication does not have a session", async () => {
    let r = await pass.create("admin")
    let session = await pass.session("admin")
    assert.equal(session, null)
  })
  it("making a request without a token should fail", async () => {
    let r = await pass.create("admin")
    console.log("r", r)
    try {
      let res = await fetch("http://localhost:3000/api").then((res) => {
        if(res.ok) {
          return res.json()
        } else {
          return res.json().then((json) => {
            throw new Error(json.error)
          })
        }
      })
      console.log("API response", res)
    } catch (e) {
      assert.equal(e.message, "not admin")
    }
  })
  it("making a request wit a token should succeed", async () => {
    let session = await pass.create("admin")
    console.log("session", session)
    let res = await fetch("http://localhost:3000/api", {
      headers: {
        "authorization": "token " + session.jwt
      }
    }).then((r) => {
      return r.json()
    })
    console.log("RES", res)
    assert.deepEqual(res, { success: true })
  })

  it('build prepares a request correctly', async () => {
    let request = await pass.build("admin")
    assert.ok(request)
    assert.ok(request.str)
    assert.ok(request.sig)
    assert.ok(request.url)
  })
  it('building and requesting creates a proper session', async () => {
    let request = await pass.build("admin")
    let session = await pass.request(request)
    assert.ok(session)
    assert.ok(session.account)
    assert.ok(session.expiresIn)
    assert.ok(session.jwt)
    let res = await fetch("http://localhost:3000/api", {
      headers: {
        "authorization": "token " + session.jwt
      }
    }).then((r) => {
      return r.json()
    })
    console.log("RES", res)
    assert.deepEqual(res, { success: true })
  })
})
