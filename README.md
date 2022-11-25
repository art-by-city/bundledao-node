# BundleDAO Node

This is a JavaScript library written in TypeScript to accept Arweave ANS-104 Binary Bundles signed with a DeSo identity for payment delegation to the Arweave Network.  See also [BundleDAO Client](https://gitlab.com/art-by-city/bundledao-client)

## Install
```bash
$ npm i --save @artbycity/bundledao-node
```

## Run Programmatically
```typescript
import Arweave from 'arweave'
import BundleDAONode from '@artbycity/bundledao-node'

import arweaveJWK from './arweave-keyfile.json'

const ARWEAVE_PROTOCOL = process.env.ARWEAVE_PROTOCOL || 'http'
const ARWEAVE_HOST = process.env.ARWEAVE_HOST || 'localhost'
const ARWEAVE_PORT = process.env.ARWEAVE_PORT
  ? Number.parseInt(process.env.ARWEAVE_PORT)
  : 1984

const arweave = new Arweave({
  protocol: ARWEAVE_PROTOCOL,
  host: ARWEAVE_HOST,
  port: ARWEAVE_PORT
})

const seedHex = 'my-deso-seed-hex'

const bundleDAONode = new BundleDAONode(seedHex, arweaveJWK, arweave, 'dbpath')

await bundleDAONode.start()
```

Or with NuxtJS/NextJS/etc Server Middleware
```typescript
// Same as above

const bundleDAONode = new BundleDAONode(seedHex, arweaveJWK, arweave, 'dbpath')
const callback = bundleDAONode.app.callback()

export default callback
```

## About BundleDAO
[BundleDAO on DAODAO](https://daodao.io/profile/BundleDAO)
