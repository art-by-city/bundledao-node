import 'dotenv/config'
import Koa from 'koa'
import Router from '@koa/router'
import { Server } from 'http'
import { JWKInterface } from 'arweave/node/lib/wallet'
import Arweave from 'arweave'
import { knex, Knex } from 'knex'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

import { buildContainer } from './inversify.config'
import { AuthState } from './interface/middleware/auth'
import { up } from './infra/db/init'
import { IRouter, ROUTERS } from './interface/router'

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
    const container = buildContainer(this.arweave, this.arweaveKeyfile)
    const router = new Router()
    const routers: { path: string, id: symbol }[] = [
      { path: '/balances', id: ROUTERS.BalancesRouter },
      { path: '/bundles', id: ROUTERS.BundlesRouter },
      { path: '/healthcheck', id: ROUTERS.HealthRouter }
    ]

    for (let i = 0; i < routers.length; i++) {
      const { path, id } = routers[i]
      const subRouter = container.get<IRouter<State, Context>>(id).router
      router.use(path, subRouter.routes(), subRouter.allowedMethods())
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
