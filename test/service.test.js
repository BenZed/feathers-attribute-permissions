import { expect, assert } from 'chai'
import feathers from 'feathers'
import hooks from 'feathers-hooks'
import memory from 'feathers-memory'
import clear from 'cli-clear'

import Permissions from '../src'
/* global describe it */

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

/******************************************************************************/
// Test
/******************************************************************************/

describe('Configuration', () => {

  it('doesn\'t kill babies', async () => {

    const user = await users.create({ name: 'Ben' })

    articles.before({ all: simulateAuth(user.id) })

    const deadBabies = Math.round(Math.random() * 3)

    if (deadBabies > 0)
      throw new Error(`${deadBabies} babies killed.`)

  })

})
