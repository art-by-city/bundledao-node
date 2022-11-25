import 'dotenv/config'
import Koa from 'koa'
import Router from '@koa/router'
import json from 'koa-json'
import bodyParser from 'koa-bodyparser'
import rawBody from 'raw-body'
import { Server } from 'http'
import { JWKInterface } from 'arweave/node/lib/wallet'
import Arweave from 'arweave'
import { knex, Knex } from 'knex'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import secp256k1 from 'secp256k1'
import { ec as EC } from 'elliptic'
import bs58check from 'bs58check'

import { up } from './db/init'

const ec = new EC('secp256k1')
const PUBLIC_KEY_PREFIXES = {
  mainnet: {
    bitcoin: [0x00],
    deso: [0xcd, 0x14, 0x0],
  },
  testnet: {
    bitcoin: [0x6f],
    deso: [0x11, 0xc2, 0x0],
  },
}

function seexHexToDeSoPublicKey(seedHex: string): string {
  const privateKey = ec.keyFromPrivate(seedHex)
  const prefix = PUBLIC_KEY_PREFIXES['mainnet'].deso
  const key = privateKey.getPublic().encode('array', true)
  const prefixAndKey = Uint8Array.from([...prefix, ...key])

  return bs58check.encode(prefixAndKey)
}

export default class BundleDAONode {
  private port: number = 1985
  server!: Server
  app: Koa = new Koa()
  private desoSeedHex!: string
  private desoPublicKey!: string
  private arweaveKeyfile!: JWKInterface
  private arweave!: Arweave
  private dbPath!: string
  private knex!: Knex

  constructor(
    desoSeedHex: string,
    arweaveKeyfile: JWKInterface,
    arweave: Arweave,
    dbPath: string
  ) {
    this.desoSeedHex = desoSeedHex
    this.desoPublicKey = seexHexToDeSoPublicKey(desoSeedHex)
    this.arweaveKeyfile = arweaveKeyfile
    this.arweave = arweave
    this.dbPath = join(process.cwd(), dbPath)
    console.log('BundleDAO dbPath', this.dbPath)
    this.knex = knex({
      client: 'sqlite3',
      connection: {
        filename: join(this.dbPath, 'db.sqlite'),
      },
      useNullAsDefault: true,
    })
    this.build()
  }

  private build() {
    const router = new Router()

    router.get('/healthcheck', (ctx) => {
      ctx.body = { health: 'ok' }

      return
    })

    router.post('/bundle', async (ctx) => {
      const data = await rawBody(ctx.req, { limit: '5mb' })
      const tx = await this.arweave.createTransaction({ data })
      tx.addTag('Bundle-Format', 'binary')
      tx.addTag('Bundle-Version', '2.0.0')
      tx.addTag('App-Name', 'BundleDAO')
      tx.addTag('App-Version', '0.1.0')

      // TODO -> ANS-108
      tx.addTag('External-Network', 'DESO')
      // tx.addTag('External-Owner', '')
      // tx.addTag('Access-Signature', '')

      // const tx = new Transaction(bundle as object)
      await this.arweave.transactions.sign(tx, this.arweaveKeyfile)
      console.log('SIGNED TX', tx.id)

      const { status, statusText } = await this.arweave.transactions.post(tx)

      ctx.status = status
      ctx.body = tx.id

      return
    })

    router.get('/derived-key', (ctx) => {
      ctx.status = 200
      ctx.body = this.desoPublicKey

      return
    })

    this.app
      .use(async (ctx, next) => {
        ctx.set('Access-Control-Allow-Origin', '*')

        await next()
      })
      // .use(json())
      // .use(bodyParser({ jsonLimit: '5mb' }))
      .use(router.routes())
      .use(router.allowedMethods())
      .use(async (ctx) => {
        if (ctx.request.method === 'OPTIONS') {
          ctx.set('Access-Control-Allow-Headers', '*')
        } else {
          ctx.status = 307
          const { protocol, host, port } = this.arweave.api.config
          ctx.set(
            'location',
            `${protocol}://${host}:${port}${ctx.request.url}`
          )
        }

        return
      })
  }

  async start() {
    if (!this.server) {
      if (!existsSync(this.dbPath)) {
        mkdirSync(this.dbPath, { recursive: true })
      }

      const exists = await this.knex.schema.hasTable('derived_keys')

      if (!exists) {
        await up(this.knex)
      }

      this.server = this.app.listen(this.port, () => {
        console.log(`BundleDAO Node listening on ${this.port}`)
      })
    }
  }

  async stop() {
    if (this.server) {
      this.server.close(() => console.log('BundleDAO Node stopped'))
    }
  }
}
