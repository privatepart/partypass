# Partypass

> node.js privateparty client

Full documentation at https://privateparty.dev

# Use cases

For anything that happens inside a browser you can use [partyconnect](https://github.com/privatepart/partyconnect)

For everything else, whre you have full access to the private key, you can use partypass.

- Embedded in mobile
- IoT
- Server side

# Install

```
npm install partypass
```

and require it:

```javascript
const Partypass = require('partypass')
```

or

```javascript
import Partypass from 'partypass'
```


# Usage

## 1. basic

```javascript
const pass = new Partypass({
  host: "http://localhost:3000",
  key: privKey
})
let session = await pass.create("user")
console.log(session)  // session includes 'account', 'expiresIn', and 'jwt'
```

## 2. build and request

You can build a request and make the actual JWT creation separately:

```javascript
const pass = new Partypass({
  host: "http://localhost:3000",
  key: privKey
})
let built = await pass.build("user")      // build a pass request object
let session = await pass.request(built)   // make an actual request and get the jwt
console.log(session)  // session includes 'account', 'expiresIn', and 'jwt'
```
