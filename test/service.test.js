import feathers from 'feathers'
import feathersClient from 'feathers/lib/client'
import hooks from 'feathers-hooks'
import rest from 'feathers-rest'
import restClient from 'feathers-rest/client'
import memory from 'feathers-memory'
import fetch from 'isomorphic-fetch'
import bodyParser from 'body-parser'
import auth from 'feathers-authentication'
import authClient from 'feathers-authentication/client'
import jwt from 'feathers-authentication-jwt'
import local from 'feathers-authentication-local'
import errorHandler from 'feathers-errors/handler'
import Permissions from '../src'

import storage from 'localstorage-memory'

import chai, { expect, assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'

chai.use(chaiAsPromised)

/* global describe it beforeEach afterEach */

/******************************************************************************/
// Helper
/******************************************************************************/

const ms = t => new Promise(resolve => setTimeout(resolve, t || 1000))

/******************************************************************************/
// Setup App
/******************************************************************************/

function setupServer() {

  const server = feathers()
    .configure(rest())
    .configure(hooks())

    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))

    .configure(auth({ secret: 'man-in-the-machine' }))
    .configure(local())
    .configure(jwt())

    .use('/users', memory())
    .use('/articles', memory())

    .use(errorHandler())

  //hooks
  const jwtAuth = auth.hooks.authenticate('jwt')
  const jwtLocalAuth = auth.hooks.authenticate(['jwt', 'local'])
  const hashPass = local.hooks.hashPassword({ passwordField: 'password' })

  const userPermissions = new Permissions('users')
  const articlePermissions = new Permissions('articles')

  server.service('users').hooks({
    before: {
      all: [ jwtAuth, userPermissions.check ],
      create: hashPass,
      patch: hashPass,
      update: hashPass
    },
    after: {
      all: [ userPermissions.filter ]
    }
  })

  server.service('articles').hooks({
    before: {
      all: [ jwtAuth, articlePermissions.check ]
    },
    after: {
      all: [ articlePermissions.filter ]
    }
  })

  server.service('authentication').hooks({
    before: {
      create: [
        jwtLocalAuth
      ],
      remove: [
        jwtAuth
      ]
    }
  })

  return server
}

function setupClient() {

  storage.clear()

  return feathersClient()
    .configure(restClient('http://localhost:3000').fetch(fetch))
    .configure(hooks())
    .configure(authClient({ storage }))

}


/******************************************************************************/
// Service Apps
/******************************************************************************/

describe('Use in services', () => {

  let server, client

  const login = { email: 'ace@global.com', password: 'cake!' }

  beforeEach(async () => {
    server = setupServer()
    client = setupClient()

    server.listener = server.listen(3000)

    await server.service('users').create({  ...login })
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

})
