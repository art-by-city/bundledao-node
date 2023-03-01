import { injectable } from 'inversify'
import Router from '@koa/router'

import { Context, State } from '../../app'

@injectable()
export default class HealthRouter {
  router: Router<State, Context> = new Router<State, Context>()

  constructor() {
    this.build()
  }

  private build() {
    this.router.get('/', (ctx) => {
      ctx.status = 200
      ctx.body = 'OK'

      return
    })
  }
}
