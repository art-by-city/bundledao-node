import Router from '@koa/router'

import { Context, State } from '../app'
import { jwt } from '../auth'

export default class BalancesRouter {
  router: Router<State, Context> = new Router<State, Context>({
    prefix: '/balance'
  })

  constructor() {
    this.build()
  }

  private build() {
    this.router.use(jwt)

    this.router.get('/', (ctx) => {
      ctx.status = 200
      ctx.body = { credit: 0, deso: 0 }

      return
    })
  }
}
