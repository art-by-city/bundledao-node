import { ParameterizedContext } from '../../app'

export type MiddlewareFunction = (
  ctx: ParameterizedContext,
  next: () => Promise<any>
) => Promise<void>

export * from './auth'
