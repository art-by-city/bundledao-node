import Router from '@koa/router'

export interface IRouter<State, Context> {
  router: Router<State, Context>
}

export { default as BalancesRouter } from './balances'
export { default as BundlesRouter } from './bundles'
export { default as HealthRouter } from './health'

export const ROUTERS = {
  BalancesRouter: Symbol.for('BalancesRouter'),
  BundlesRouter: Symbol.for('BundlesRouter'),
  HealthRouter: Symbol.for('HealthRouter')
}
