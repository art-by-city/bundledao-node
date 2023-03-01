import { inject, injectable } from 'inversify'
import Router from '@koa/router'

import { Context, State } from '../../app'
import { MiddlewareFunction } from '../middleware'

@injectable()
export default class BalancesRouter {
  router: Router<State, Context> = new Router<State, Context>()

  constructor(
    @inject('JWT') private jwt: MiddlewareFunction
  ) {
    this.build()
  }

  private build() {
    this.router.use(this.jwt)

    this.router.get('/', (ctx) => {
      ctx.status = 200
      ctx.body = { credit: 0, deso: 0 }

      return
    })
  }
}
