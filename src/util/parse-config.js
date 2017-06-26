import is from 'is-explicit'
import { HANDLERS } from './symbols'
import { testAttributesForFlag } from '../common'

import define from 'define-utility'

/******************************************************************************/
// Defaults
/******************************************************************************/

function noPermissionsRequired() {
  return false
}

/******************************************************************************/
// Helper
/******************************************************************************/

function createHandlerFromConfig(config, main, alt) {

  const func = is(config, String) ? createHandler(`${config}-${alt || main}`)
    : is.plainObject(config)      ? createHandler(config[main] || config[alt])
    : /*is anything else*/          createHandler(config)

  if (is.plainObject(func) && main === 'remove')
    throw new Error('Invalid configuration: \'remove\' method doesn\'t access data, and cannot be configured with an object.')

  return func

}

function createHandler(config) {

  const func = is(config, Function) ? config

    //if configured with strings, we'll use the default attribute check method
    : is(config, String) || is.arrayOf(config, String) ? testAttributesForFlag(config)

    //if configured with an object, it's assumed that there are sub fields that
    //need their own permissions checking
    : is.plainObject(config) ? createHandlerFromObject(config)

    //if configured with false or null/undefined, permissions are not required
    //for this method or field
    : config === false || !is(config) ? noPermissionsRequired

    //anything else is invalid
    : null

  if (func === null)
    throw new Error(String(config) + ' is not a valid permissions configuration')

  return func

}

function createHandlerFromObject(input) {
  const output = {}

  for (const key in input)
    output[key] = createHandler(input[key])

  return output
}

/******************************************************************************/
// Exports
/******************************************************************************/

export default function parseConfig(config) {

  if (!is(config, Object, String, Function))
    throw new Error('Requires an object or string as configuration.')

  const handlers = {
    find:   createHandlerFromConfig(config, 'find',   'view'),
    get:    createHandlerFromConfig(config, 'get',    'view'),
    patch:  createHandlerFromConfig(config, 'patch',  'edit'),
    update: createHandlerFromConfig(config, 'update', 'edit'),
    create: createHandlerFromConfig(config, 'create'),
    remove: createHandlerFromConfig(config, 'remove')
  }

  const permissions = this

  define(permissions)
    .const(HANDLERS, handlers)

}
