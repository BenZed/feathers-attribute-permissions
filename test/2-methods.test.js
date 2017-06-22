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

  beforeEach(async () => {
    server = setupServer()

    const users = server.service('users')

    await users.create({ ...admin })

    await users.create({ ...joe })

    server.listener = server.listen(3000)

    client = setupClient()

  })

  afterEach(() => server.listener.close())

  it('Requires authentication', async () => {

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

  describe('User edit/remove calls must pass permission tests', async () => {

    const testCheck = (method, ...args) => async () => {

      await server.service('articles').create({ body: 'Article Created Serverside' })

      await client.logout()
      await client.authenticate({ strategy: 'local', ...joe })

      await expect(client.service('articles')[method](...args))
        .to.eventually.be.rejectedWith(`You cannot ${method} articles.`)

      await client.logout()
      await client.authenticate({ strategy: 'local', ...admin })

      await expect(client.service('articles')[method](...args))
        .to.eventually.be.fulfilled
    }

    it('create', testCheck('create', { body: 'New Article.'}))

    it('patch', testCheck('patch', 0, { body: 'Patched Article.'}))

    it('update', testCheck('update', 0, { body: 'Updated Article.'}))

    it('remove', testCheck('remove', 0 ))

  })

  describe('User view calls must be filtered by permissions tests', async () => {

    const testFilter = (method, query) => async () => {

      const articles = server.service('articles')

      await articles.create({ body: 'Article 1'})
      await articles.create({ body: 'Article 2'})
      await articles.create({ body: 'Article 3'})
      await articles.create({ body: 'Article 4'})

      const allArticleDocs = await articles.find({})

      await client.logout()
      await client.authenticate({ strategy: 'local', ...joe })
      const joeRequest = client.service('articles')[method](query)

      await (method === 'find'
        ? expect(joeRequest).to.eventually.deep.equal([])
        : expect(joeRequest).to.eventually.be.rejectedWith(`You cannot view document with id ${query}`)
      )

      await client.logout()
      await client.authenticate({ strategy: 'local', ...admin })

      const adminRequest = client.service('articles')[method](query)

      await (
        method === 'find'
          ? expect(adminRequest).to.eventually.deep.equal(allArticleDocs)
          : expect(adminRequest).to.eventually.deep.equal(allArticleDocs[query])
      )

    }

    it('find', testFilter('find', {}))
    it('get', testFilter('get', 0))

  })

})
