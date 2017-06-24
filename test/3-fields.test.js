import chai, { expect, assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'

import setupClient from './helper/setup-client'
import setupServer from './helper/setup-server'

import { attributesHasFlag } from '../src'

/* global describe it beforeEach afterEach */

/******************************************************************************/
// Extend Chai
/******************************************************************************/

chai.use(chaiAsPromised)

describe('Field level usage in Services', function() {

  this.slow(400)

  let client, server

  const admin = {
    email: 'admin@app.com',
    password: 'admin',
    permissions: {
      'users-manage': true
    }
  }

  const jane = {
    email: 'jane@app.com',
    password: 'jane',
    permissions: {

    }
  }

  beforeEach(async () => {

    const isSelfOrHasFlag = flag =>
      (attributes, hook) => {

        return hook.original && hook.params.user.id === hook.original.id
          ? false
          : !attributesHasFlag(attributes, flag)
      }


    const isAuthorOrHasFlag = flag =>
      (attributes, hook) => {
        if (attributesHasFlag(attributes, flag))
          return false

        const { original, params: { user } } = hook

        return original && original.author !== user.id
          ? 'You may only edit articles you are the author of.'
          : false
      }

    server = setupServer({
      userConfig: {
        remove: 'users-manage',
        create: 'users-manage',
        edit: {
          permissions: 'users-manage',
          email: isSelfOrHasFlag('users-manage'),
          password: isSelfOrHasFlag('users-manage')
        },
        view: {
          permissions: 'users-manage'
        }
      },
      articleConfig: {
        create: {
          author: (attr, { data, params }) => {
            if (attributesHasFlag(attr, 'users-manage'))
              return false

            return data.author && data.author !== params.user.id
              ? 'You cannot create articles for other users.'
              : false
          },
        },
        remove: 'articles-manage',
        edit: {
          body: isAuthorOrHasFlag('articles-manage'),
          author: 'articles-manage'
        }
      }
    })

    server.start()

    client = setupClient()

    const articles = server.service('articles')
    const users = server.service('users')

    jane.id = (await users.create({ ...jane })).id
    admin.id = (await users.create({ ...admin })).id

    await articles.create({ body: 'Test article', author: admin.id })
    await articles.create({ body: 'Janes first article', author: jane.id })

  })

  afterEach(() => server.stop())

  describe('User edit calls must pass individual field permissions', () => {

    it('create', async () => {

      await client.logout()
      await client.authenticate({ strategy: 'local', ...jane })

      const clientArticles = client.service('articles')

      const create = clientArticles
        .create({
          body: 'Creating an Article for admin',
          author: admin.id
        })

      const error = await expect(create)
        .to.eventually.be.rejected

      assert.deepEqual(error.errors, { author: 'You cannot create articles for other users.'})

    })

    it('update', async () => {

      await client.logout()
      await client.authenticate({ strategy: 'local', ...jane })
      const clientArticles = client.service('articles')

      const [ janesArticle ] = await clientArticles.find({ query: { author: jane.id }})

      const update = clientArticles
        .update(janesArticle.id, {
          body: 'Jane is thrilled with this article.',
          author: jane.id
        })

      const error = await expect(update)
        .to.eventually.be.rejected

      assert.deepEqual(error.errors, {
        author: 'You cannot update field \'author\'.'
      })
    })

    it('patch', async () => {

      await client.logout()
      await client.authenticate({ strategy: 'local', ...jane })

      const clientArticles = client.service('articles')
      const clientUsers = client.service('users')

      const [ janesArticle ] = await clientArticles.find({ query: { author: jane.id }})

      let patch = clientArticles
        .patch(janesArticle.id, {
          body: 'Jane is thrilled with this article.'
        })

      await expect(patch)
        .to.eventually.be.fulfilled

      patch = clientUsers
        .patch(jane.id, {
          password: 'something-else'
        })

      await expect(patch)
        .to.eventually.be.fulfilled

      patch = clientUsers
        .patch(admin.id, {
          password: 'something-else',
          email: 'some-other-admin@gmail.com'
        })

      let error = await expect(patch)
        .to.eventually.be.rejected

      assert.deepEqual(error.errors, {
        password: 'You cannot patch field \'password\'.',
        email: 'You cannot patch field \'email\'.'
      })

      const [ adminArticle ] = await clientArticles.find({ query: { author: admin.id }})

      patch = clientArticles
        .patch(adminArticle.id, {
          body: 'Test Article.',
          author: jane.id
        })

      error = await expect(patch)
        .to.eventually.be.rejected

      assert.deepEqual(error.errors, {
        body: 'You may only edit articles you are the author of.',
        author: 'You cannot patch field \'author\'.'
      })
    })
  })

  describe('User view calls must filter individual field permissions', () => {

    it('find', async () => {

      await client.logout()
      await client.authenticate({ strategy: 'local', ...jane })
      const clientUsers = client.service('users')

      let users = await clientUsers.find({})
      for (const user of users)
        assert.equal('permissions' in user, false)

      await client.logout()
      await client.authenticate({ strategy: 'local', ...admin })

      users = await clientUsers.find({})
      for (const user of users)
        assert.equal('permissions' in user, true)

    })

    it('get', async () => {

      await client.logout()
      await client.authenticate({ strategy: 'local', ...jane })
      const clientUsers = client.service('users')

      let janeDoc = await clientUsers.get(jane.id)
      assert.equal('permissions' in janeDoc, false)

      await client.logout()
      await client.authenticate({ strategy: 'local', ...admin })

      janeDoc = await clientUsers.get(jane.id)
      assert.equal('permissions' in janeDoc, true)

    })

  })

})
