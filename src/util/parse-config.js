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

function determineHandler(config, main, alt) {

  const func = is(config, String)              ? ensureFuncs(`${config}-${alt || main}`)
    : is(config, Object) && !is(config, Array) ? ensureFuncs(config[main] || config[alt])
    : /*is anything else*/                       ensureFuncs(config)

  if (is.plainObject(func) && main === 'remove')
    throw new Error('Invalid configuration: \'remove\' method doesn\'t access data, and cannot be configured with an object.')

  return func

}

function determineHandlers(config) {

  return {
    find:   determineHandler(config, 'find',   'view'),
    get:    determineHandler(config, 'get',    'view'),
    patch:  determineHandler(config, 'patch',  'edit'),
    update: determineHandler(config, 'update', 'edit'),
    create: determineHandler(config, 'create'),
    remove: determineHandler(config, 'remove')
  }

}

function ensureFuncsFromObject(input) {
  const output = {}

  for (const key in input)
    output[key] = ensureFuncs(input[key])

  return output
}

function ensureFuncs(config) {


  const func = is(config, Function) ? config

    //if configured with strings, we'll use the default attribute check method
    : is(config, String) || is.arrayOf(config, String) ? testAttributesForFlag(config)

    //if configured with an object, it's assumed that there are sub fields that
    //need their own permissions checking
    : is.plainObject(config) ? ensureFuncsFromObject(config)

    //if configured with false or null/undefined, permissions are not required for this method or field
    : config === false || !is(config) ? noPermissionsRequired

    //anything else is invalid
    : null

  if (func === null)
    throw new Error(String(config) + ' is not a valid permissions configuration')

  return func

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default function parseConfig(config) {

  if (!is(config, Object, String, Function))
    throw new Error('Requires an object or string as configuration.')

  const permissions = this

  const handlers = permissions::determineHandlers(config)

  define(permissions)
    .const(HANDLERS, handlers)

}
