import memory from 'feathers-memory'

import errorHandler from 'feathers-errors/handler'
import Permissions from '../src'

import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'

import setupClient from './helper/setup-client'
import setupServer from './helper/setup-server'

/* global describe it beforeEach afterEach */

/******************************************************************************/
// Extend Chai
/******************************************************************************/

chai.use(chaiAsPromised)

/******************************************************************************/
// Service Apps
/******************************************************************************/

describe('Method level usage in Services', function() {

  this.slow(400)

  let server, client

  const admin = {
    email: 'admin@email.com',
    password: 'admin',
    permissions: {
      'articles-create': true,
      'articles-edit': true,
      'articles-view': true,
      'articles-remove': true
    }
  }

  const joe = {
    email: 'joe@user.com',
    password: 'joe'
  }

  const setup = async config => {
    server = setupServer(config)

    const users = server.service('users')

    await users.create({ ...admin })

    await users.create({ ...joe })

    server.start()

    client = setupClient()
  }

  describe('Requires', () => {

    beforeEach(async () => setup())

    afterEach(() => server.stop())

    it('Authentication', async () => {

      const foobarPermissions = new Permissions('foobar')
      server.use('foobar', memory())
        .service('foobar')
        .hooks({
          after: { all: foobarPermissions.filter }
        })

      server.use(errorHandler())

      return expect(client.service('foobar').find({}))
        .to.eventually.be
        .rejectedWith('User not resolved, permissions could not be determined.')

    })

  })

  const chapters = [{
    name: 'Non Paginated Services',
    config: {}
  }, {
    name: 'Paginated Services',
    config: {
      userServiceConfig: { paginate: { default: 5, max: 10 } },
      articleServiceConfig: { paginate: { default: 5, max: 10 } },
    }
  }]

  for (const chapter of chapters) describe(chapter.name, () => {

    beforeEach(() => setup(chapter.config))

    afterEach(() => server.stop())

    describe('User edit/remove calls must pass permission tests', async () => {

      const testCheck = (method, ...args) => async () => {

        await server
          .service('articles')
          .create({ body: 'Article Created Serverside' })

        await client.logout()
        await client.authenticate({ strategy: 'local', ...joe })

        await expect(client.service('articles')[method](...args))
          .to.eventually.be.rejectedWith(`You cannot ${method} articles.`)

        await client.logout()
        await client.authenticate({ strategy: 'local', ...admin })

        await expect(client.service('articles')[method](...args))
          .to.eventually.be.fulfilled
      }

      it('create', testCheck('create', { body: 'New Article.' }))

      it('patch', testCheck('patch', 0, { body: 'Patched Article.' }))

      it('update', testCheck('update', 0, { body: 'Updated Article.' }))

      it('remove', testCheck('remove', 0 ))

    })

    describe('Results must be filtered by permissions tests', async () => {

      const testFilter = (method, arg) => async () => {

        const articles = server.service('articles')

        await articles.create({ body: 'Article 1' })
        await articles.create({ body: 'Article 2' })
        await articles.create({ body: 'Article 3' })
        await articles.create({ body: 'Article 4' })

        const adminExpectedResult = await articles[method](arg)

        await client.logout()
        await client.authenticate({ strategy: 'local', ...joe })

        let joeResult

        try {
          joeResult = await client.service('articles')[method](arg)
          if ('data' in joeResult)
            joeResult = joeResult.data
        } catch (err) {
          joeResult = err
        }

        await (method !== 'get'
          ? expect(joeResult).to.deep.equal([])
          : expect(joeResult).to.have.property('message', `You cannot view document with id ${arg}`)
        )

        await client.logout()
        await client.authenticate({ strategy: 'local', ...admin })

        const adminResult = await client.service('articles')[method](arg)

        return expect(adminResult)
          .to.deep
          .equal(adminExpectedResult)

      }

      it('find', testFilter('find', {}))
      it('get', testFilter('get', 0))
      // it('patch', testFilter('patch', 0))
      // it('update', testFilter('update', 0))
      // it('remove', testFilter('remove', 0))

    })
  })

})
