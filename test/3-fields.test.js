import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'

import setupClient from './helper/setup-client'
import setupServer from './helper/setup-server'

import { fieldEditView, attributesHasFlag } from '../src'

/* global describe it beforeEach afterEach */

/******************************************************************************/
// Extend Chai
/******************************************************************************/

chai.use(chaiAsPromised)

describe('Field level usage in Services', () => {

  let client, server

    const admin = {
      email: 'admin@app.com',
      password: 'admin',
      permissions: {
        admin: true
      }
    }

    const jane = {
      email: 'jane@app.com',
      password: 'jane',
      permissions: {
        'user-view': true,
        'articles-view': true
      }
    }


  beforeEach(async () => {

    const buildConfig = (key, fields) => {
      const main = [ `${key}-manage`, 'admin']
      return {
        view: [`${key}-view`, ...main],
        remove: [...main],
        fields
      }
    }

    const isSelfOrManager = field => (attributes, hook) => {

      if (attributes['users-manage'] || attributes['admin'] || hook.id === hook.params.user.id)
        return false

      return `You do not have permission to edit the ${field} of ${hook.params.user.email}`
    }

    server = setupServer({
      userConfig: buildConfig('users', {
        email: isSelfOrManager('email'),
        password: isSelfOrManager('password'),
        permissions(attributes, hook, value) {

          if (hook.method === 'find' || hook.method === 'get')
            return attributes['users'] || attributes['users-manage'] || attributes.admin

          if (!attributes['users-manage'] || !attributes.admin)
            return 'You do not have permission to edit user permissions.'

          if (value.admin && !attributes.admin)
            return 'You do not have permission to make yourself an admin.'

          return false
        }
      }),
      articleConfig: buildConfig('articles', {
        body: async (attr, {method, id, params: { user }, app}) => {

          if (method === 'find' || method === 'get')
            return false

          if (attributesHasFlag(attr, ['admin', 'articles-manage']))
            return false

          if (method === 'create')
            return false

          const doc = await app.service('articles').get(id)
          return doc.author == user.id
            ? false
            : 'You do not have permission to edit an article you are not the author of.'
        },
      })
    })

    client = setupClient()

    const articles = server.service('articles')
    const users = server.service('users')

    const janeDoc = await users.create({ ...jane })
    const adminDoc = await users.create({ ...admin })

    await articles.create({ body: 'This is an old article.', author: janeDoc.id })
    await articles.create({ body: 'Test Aritcle', author: adminDoc.id })

  })

  afterEach(() => server.listener.close())

  describe('User edit calls must pass individual field permissions', () => {

    it('create', async () => {

    })

    it('update')
    it('patch')

  })

  describe('User view calls must filter individual field permissions', () => {

    it('find')
    it('get')

  })

})
