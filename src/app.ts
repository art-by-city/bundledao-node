import 'dotenv/config'
import Koa from 'koa'
import Router from '@koa/router'
import { Server } from 'http'
import { JWKInterface } from 'arweave/node/lib/wallet'
import Arweave from 'arweave'
import { knex, Knex } from 'knex'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

import { AuthState } from './auth'
import { up } from './db/init'
import { BalancesRouter, BundlesRouter } from './routes'

export type State = Koa.DefaultState & {
  auth?: AuthState
}
export type Context = Koa.DefaultContext & {}
export type ParameterizedContext = Koa.ParameterizedContext<
  State,
  Context & Router.RouterParamContext<State, Context>,
  unknown
>

export default class BundleDAONode {
  private port: number = 1985
  private dbPath!: string
  private knex!: Knex
  server!: Server
  app: Koa<State, Context> = new Koa<State, Context>()

  constructor(
    private arweaveKeyfile: JWKInterface,
    private arweave: Arweave,
    dbPath: string
  ) {
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

    const routers = [
      new BalancesRouter().router,
      new BundlesRouter(
        this.arweave,
        this.arweaveKeyfile
      ).router
    ]

    for (let i = 0; i < routers.length; i++) {
      const subRouter = routers[i]
      router.use(subRouter.routes(), subRouter.allowedMethods())
    }

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
          ctx.status = 200
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
