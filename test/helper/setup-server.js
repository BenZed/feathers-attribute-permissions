import feathers from 'feathers'
import rest from 'feathers-rest'
import hooks from 'feathers-hooks'
import socketio from 'feathers-socketio'
import bodyParser from 'body-parser'
import auth from 'feathers-authentication'
import jwt from 'feathers-authentication-jwt'
import local from 'feathers-authentication-local'
import memory from 'feathers-memory'
import errorHandler from 'feathers-errors/handler'

import Permissions from '../../src'

import USE_SOCKET_IO_INSTEAD_OF_REST from './provider'

export default function setupServer({
  userConfig = 'users',
  articleConfig = 'articles'
} = {}) {

  const provider = USE_SOCKET_IO_INSTEAD_OF_REST ? socketio() : rest()

  const server = feathers()
    .configure(provider)
    .configure(hooks())

    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))

    .configure(auth({ secret: '12983098xhq8ehd10283u10398hlkehf189edu109e8f1peudh120e8fh1203-d81-289dh1e0odhu029uwhd-128edu-s98' }))
    .configure(local())
    .configure(jwt())

    .use('/users', memory())
    .use('/articles', memory())

    .use(errorHandler())

  //hooks
  const jwtAuth = auth.hooks.authenticate('jwt')
  const jwtLocalAuth = auth.hooks.authenticate(['jwt', 'local'])
  const hashPass = local.hooks.hashPassword({ passwordField: 'password' })

  const userPermissions = new Permissions(userConfig)
  const articlePermissions = new Permissions(articleConfig)

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
