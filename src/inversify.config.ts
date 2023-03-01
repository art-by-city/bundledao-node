import 'reflect-metadata'
import { Container } from 'inversify'
import Arweave from 'arweave'
import { JWKInterface } from 'arweave/node/lib/wallet'

import { Context, State } from './app'
import { jwt, MiddlewareFunction } from './interface/middleware'
import {
  BalancesRouter,
  BundlesRouter,
  HealthRouter,
  IRouter,
  ROUTERS
} from './interface/router'

export const buildContainer = (
  arweave: Arweave,
  arweaveKeyfile: JWKInterface
): Container => {
  const container = new Container()

  /**
   * Keys
   */
  container.bind<JWKInterface>('ArweaveKeyfile').toConstantValue(arweaveKeyfile)

  /**
   * Clients
   */
  container.bind<Arweave>('Arweave').toConstantValue(arweave)

  /**
   * Middleware
   */
  container.bind<MiddlewareFunction>('JWT').toConstantValue(jwt)

  /**
   * Routers
   */
  container
    .bind<IRouter<State, Context>>(ROUTERS.BalancesRouter)
    .to(BalancesRouter)
  container
    .bind<IRouter<State, Context>>(ROUTERS.BundlesRouter)
    .to(BundlesRouter)
  container
    .bind<IRouter<State, Context>>(ROUTERS.HealthRouter)
    .to(HealthRouter)

  return container
}
