import { expect, assert } from 'chai'
import feathers from 'feathers'
import hooks from 'feathers-hooks'
import memory from 'feathers-memory'
import clear from 'cli-clear'

/* global describe it */

import Permissions from '../src'

/******************************************************************************/
// Fake User Hooks
/******************************************************************************/

function simulateAuth(id = 0) {

  return async function(hook) {

    const { app } = hook
    const users = app.service('users')

    try {

      const user = await users.get(id)

      hook.params.provider = 'rest'
      hook.params.user = user

      return hook

    } catch(err) {
      //user doesn't exist yet
    }
  }
}

/******************************************************************************/
// Test App
/******************************************************************************/

clear()

const app = feathers()
  .configure(hooks())
  .use('/users', memory())
  .use('/articles', memory())

const users = app.service('users')
const articles = app.service('articles')

const articlePermissions = new Permissions({
  view: 'articles',
  edit: 'articles',
  create: 'articles',
  remove: 'articles-admin'

})

/******************************************************************************/
// Test
/******************************************************************************/

describe('Permissions object', () => {

  it('takes a definition and an options object', async () => {

    const user = await users.create({ name: 'Ben' })

    await users.patch(user.id, { permissions: {
      'articles': true,
      'articles-admin': false
    }})

    articles.before({ all: [simulateAuth(user.id), articlePermissions.check] })
    articles.after({ all: articlePermissions.filter })

    await articles.create({ name: 'test', body: 'ooooo check it out!'})
    await articles.create({ name: 'test1', body: 'I am a banana'})
    await articles.create({ name: 'test2', body: 'Im a goat'})
    await articles.create({ name: 'test3', body: 'Im a jerry'})
    await articles.create({ name: 'test4', body: 'This is quite amazing'})

    console.log(await articles.find({}))

    // await articles.remove(4)

  })

})
