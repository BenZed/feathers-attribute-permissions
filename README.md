# Feathers Attribute Permissions

# ALPHA VERSION DOCUMENTATION
If you're reading this, feathers-attribute-permissions is in alpha, and not all of the functionality is fully described or finalized.
___
# Why?

  - You're using [feathers.js](http://www.feathersjs.com) serverside, and you'd like use attribute based permissions for user interaction.
  - You're a strong, wise person with a bright future.

___

# QuickStart

The following assumes you're familiar with [feathers.js](http://www.feathersjs.com) workflow. If you've never heard of [feathers.js](http://www.feathersjs.com) before, it's great. Learn it: [feathers.js](http://www.feathersjs.com)

## Install

```
npm install feathers-attribute-permissions
```

## Create an app with authentication and a user service

```js

import feathers from 'feathers'
import rest from 'feathers-rest'
import hooks from 'feathers-hooks'
import auth from 'feathers-authentication'
import local from 'feathers-authentication-local'
import jwt from 'feathers-authentication-jwt'
import memory from 'feathers-memory'
import errorHandler from 'feathers-errors/handler'

import parser from 'body-parser'

const server = feathers()
  .configure(rest())
  .configure(hooks())

  .use(parser.json())
  .use(parser.urlencoded({ extended: true }))

  .configure(auth({ secret: 'man-in-the-machine' }))
  .configure(local())
  .configure(jwt())

  .use('/users', memory())
  .user('/articles', memory())

  .use(errorHandler())

//Auth hooks
const jwtLocalAuth = auth.hooks.authentication(['local', 'jwt'])
const jwtAuth = auth.hooks.authentication('jwt')

server.service('authentication').hooks({
  before: {
    create: [ jwtLocalAuth ],
    remove: [ jwtAuth ]
  }
})

//start that server up
server.listen(3000)

```

## Set up the user service with authentication and permissions

```js

import Permissions from 'feathers-attribute-permissions'

//very basic permissions creation. If permissions gets a
//string, it will create a series of attributes service
//methods. In this case:
//users-view
//users-create
//users-edit
//users-remove
const userPermissions = new Permissions('users')

//user hooks
const hashPass = local.hooks.hashPassword({
    passwordField: 'password'
  })

const users = server.service('users')
users.hooks({

  before: {
    find: jwtAuth,
    get:  jwtAuth,
    //the check permissions hook is attached to the permissions
    //object and it should be placed after authentication
    //on before 'create','patch','update' or 'remove' hooks
    create: [ jwtAuth, hashPass, userPermissions.check ],
    patch:  [ jwtAuth, hashPass, userPermissions.check ],
    update: [ jwtAuth, hashPass, userPermissions.check ],
    remove: [ jwtAuth, hashPass, userPermissions.check ]
  },

  after: {
    //the filter permissions hook is also attached to the
    //permissions object and it should be placed on
    //after 'find' or 'get' hooks
    get:  [ userPermissions.filter ]
    find: [ userPermissions.filter ]
  }

})

```

## Set up permissions for the articles service

```js

const articlePermissions = new Permissions({
  view:  ['articles', 'articles-manage'],
  edit:   'articles-manage'
  create: 'articles-manage',
  remove: 'articles-manage'
})

const articles = server.service('articles')

articles.hooks({

  //you can also set up the check hook as an 'all' hook,
  //and it will be ignored during 'find' and 'get'
  before: {
    all: [ jwtAuth, articlePermissions.check ]
  }

  //likewise with the filter hook. It will be ignored during
  //'update', 'patch', 'create' and 'remove'
  after: {
    all:  articlePermissions.filter
  }

})

```

## Set up a client

```js

import feathers from 'feathers/lib/client'
import rest from 'feathers-rest/client'
import hooks from 'feathers-hooks'
import auth from 'feathers-authentication/client'

import storage from 'localstorage-memory'
//or just window.localStorage, if you're testing in the browser

import fetch from 'fetch-isomorphic'
//or just window.fetch if you're testing in the browser

const client = feathers()
  .configure(rest('http://localHost:3000').fetch(fetch))
  .configure(hooks())
  .configure(auth({ storage }))

```

## Create a couple of users on the server

```js


//Set up a user that has the maximum permissions
server.service('users').create({
  email: 'admin@yourapp.com',
  password: 'admin',

  //users need to have a permissions object on them. Permissions 
  permissions: {
    'users-create': true,
    'users-edit': true,
    'users-view': true,
    'users-remove': true,
    'articles-manage': true,
  }
})


```
