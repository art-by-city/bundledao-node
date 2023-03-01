import { inject, injectable } from 'inversify'
import Router from '@koa/router'
import rawBody from 'raw-body'
import Arweave from 'arweave'
import { JWKInterface } from 'arweave/node/lib/wallet'
import axios from 'axios'

import { Context, State } from '../../app'
import { MiddlewareFunction } from '../middleware'
import { IRouter } from './'

@injectable()
export default class BundlesRouter implements IRouter<State, Context> {
  router: Router<State, Context> = new Router<State, Context>()

  constructor(
    @inject('Arweave') private arweave: Arweave,
    @inject('ArweaveKeyfile') private arweaveKeyfile: JWKInterface,
    @inject('JWT') private jwt: MiddlewareFunction
  ) {
    this.build()
  }

  private build() {
    this.router.use(this.jwt)

    this.router.post('/', async (ctx) => {
      let data
      try {
        data = await rawBody(ctx.req, { limit: '5mb' })
      } catch (rawBodyError) {
        if (rawBodyError.type === 'entity.too.large') {
          ctx.status = 413
        } else {
          ctx.status = 500
        }

        return
      }

      const tx = await this.arweave.createTransaction({ data })
      tx.addTag('Bundle-Format', 'binary')
      tx.addTag('Bundle-Version', '2.0.0')
      tx.addTag('App-Name', 'BundleDAO')
      tx.addTag('App-Version', `node-${process.env.npm_package_version}`)

      await this.arweave.transactions.sign(tx, this.arweaveKeyfile)
      console.log('signed tx', tx.id)

      const {
        status,
        statusText,
        data: postData
      } = await this.arweave.transactions.post(tx)

      console.log('post result', status, statusText)

      // Mine the result on ArLocal for the BundleDAO Demo!
      const {
        status: miningStatus,
        statusText: miningStatusText
      } = await axios.get('http://localhost:1984/mine')
      console.log('mining result', miningStatus, miningStatusText)

      ctx.status = 200
      ctx.body = tx.id

      return
    })
  }
}
