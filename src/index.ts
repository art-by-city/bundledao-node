import 'dotenv/config'
import Arweave from 'arweave'
import { readFile } from 'fs/promises'

import BundleDAONode from './app'

;(async () => {
  const ARWEAVE_KEYFILE = process.env.ARWEAVE_KEYFILE || ''
  const ARWEAVE_PROTOCOL = process.env.ARWEAVE_PROTOCOL || 'http'
  const ARWEAVE_HOST = process.env.ARWEAVE_HOST || 'localhost'
  const ARWEAVE_PORT = process.env.ARWEAVE_PORT
    ? Number.parseInt(process.env.ARWEAVE_PORT)
    : 1984
  const DB_PATH = process.env.DBPATH || '.db'

  const arweaveKeyfile = JSON.parse(
    (await readFile(ARWEAVE_KEYFILE)).toString()
  )
  const bundleDAONode = new BundleDAONode(
    arweaveKeyfile,
    new Arweave({
      protocol: ARWEAVE_PROTOCOL,
      host: ARWEAVE_HOST,
      port: ARWEAVE_PORT
    }),
    DB_PATH
  )

  await bundleDAONode.start()

  process.on('SIGINT', () => { bundleDAONode.stop() })
  process.on('SIGTERM', () => { bundleDAONode.stop() })
})()
