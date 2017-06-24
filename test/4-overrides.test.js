import chai, { expect, assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'

import setupClient from './helper/setup-client'
import setupServer from './helper/setup-server'

/* global describe it beforeEach afterEach */

/******************************************************************************/
// Extend Chai
/******************************************************************************/

chai.use(chaiAsPromised)

/******************************************************************************/
// Tests
/******************************************************************************/

describe('Document permission overrides', function() {

  this.slow(400)
  this.timeout(5000)

  let server, client, article

  const user = {
    email: 'user@app.com',
    password: 'user',
    permissions: {
      'articles-create': true,
      'articles-edit': true,
      'articles-view': true,
      'articles-remove': true
    }
  }

  beforeEach(async () => {

    server = setupServer()

    server.start()

    client = setupClient()

    const articles = server.service('articles')
    const users = server.service('users')

    user.id = (await users.create({ ...user })).id

    article = await articles.create({
      body: 'Inaccessible to user.',
      author: [user.id],
      permissions: {
        [user.id]: {
          'articles-create': false,
          'articles-edit': false,
          'articles-view': false,
          'articles-remove': false
        }
      }
    })

  })

  afterEach(() => server.stop())

  describe('Overrides user permissions at the method level', () => {

    it('update', async () => {

      await client.authenticate({ strategy: 'local', ...user })

      const articles = client.service('articles')

      await expect(articles.update(article.id, {
        body: 'Whatever',
        author: 'YO MOMMA'
      })).to.eventually.be.rejectedWith('You cannot update articles.')

    })

    it('patch', async () => {

      await client.authenticate({ strategy: 'local', ...user })

      const articles = client.service('articles')

      await expect(articles.patch(article.id, {
        body: 'Just altering the ol body, here.',
      })).to.eventually.be.rejectedWith('You cannot patch articles.')

    })

    it('find', async () => {

      await client.authenticate({ strategy: 'local', ...user })

      const articles = client.service('articles')

      const docs = await articles.find({})

      assert.deepEqual(docs, [])

    })

    it('get', async () => {

      await client.authenticate({ strategy: 'local', ...user })

      const articles = client.service('articles')

      await expect(articles.get(article.id))
        .to.eventually.be
        .rejectedWith('You cannot view document with id 0')

    })

  })

  it('Users cannot overwrite permissions they do not have access to', async () => {

    await client.authenticate({ strategy: 'local', ...user })

    const articles = client.service('articles')

    const patch = articles.patch(article.id, {
      permissions: {
        [user.id]: {
          'articles-edit': true
        }
      }
    })

    await expect(patch).to.eventually.be.rejectedWith('You cannot patch articles.')

  })

})
