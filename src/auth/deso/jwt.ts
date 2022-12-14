import jsonwebtoken from 'jsonwebtoken'

import { ParameterizedContext } from '../../app'
import { desoPublicKeyToPemEncodedPublicKey } from '../../util'

export default async function (
  ctx: ParameterizedContext,
  next: () => Promise<any>
) {
  if (ctx.headers.authorization) {
    const [ desoPublicKey, jwt ] = ctx.headers.authorization.split(' ')
    try {
      const pk = desoPublicKeyToPemEncodedPublicKey(desoPublicKey)
      jsonwebtoken.verify(jwt, pk, {
        algorithms: ['ES256'],
        maxAge: '10m'
      })
      ctx.state.auth = { desoPublicKey, jwt }
      await next()
    } catch (error) {
      ctx.status = 401

      return
    }
  } else {
    ctx.status = 401
  }
}
