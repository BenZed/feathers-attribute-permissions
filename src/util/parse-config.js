import is from 'is-explicit'
import { METHOD_FLAGS, FIELD_FLAGS } from './symbols'
import { attributesHasFlag } from '../helper'

import define from 'define-utility'

/******************************************************************************/
// Defaults
/******************************************************************************/

function pass() {
  return false
}

function defaultAttributeCheck(flag) {
  return attr => !attributesHasFlag(attr, flag)
}

/******************************************************************************/
// Helper
/******************************************************************************/

function determineMethodFunc(config, main, alt) {

  const func = is(config, String)              ? ensureFuncs(`${config}-${alt || main}`)
    : is(config, Object) && !is(config, Array) ? ensureFuncs(config[main] || config[alt])
    : ensureFuncs(config)

  if (is.plainObject(func))
    throw new Error(`Invalid configuration: config.${config[main] ? main : alt} must be a string, array of strings or function.`)

  return func
}

function determineMethodFuncs(config) {

  return {
    find:   determineMethodFunc(config, 'find',   'view'),
    get:    determineMethodFunc(config, 'get',    'view'),
    patch:  determineMethodFunc(config, 'patch',  'edit'),
    update: determineMethodFunc(config, 'update', 'edit'),
    create: determineMethodFunc(config, 'create'),
    remove: determineMethodFunc(config, 'remove')
  }

}

function ensureFuncsFromObject(input) {
  const output = {}

  for (const key of input)
    output[key] = ensureFuncs(input[key])

  return output
}

function ensureFuncs(config) {

  const func = is(config, String) || is.arrayOf(config, String) ? defaultAttributeCheck(config)
    : is.plainObject(config) ? ensureFuncsFromObject(config)
    : is(config, Function) ? config
    : pass

  return func

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default function parseConfig(config) {

  if (!is(config, Object, String, Function))
    throw new Error('Requires an object or string as configuration.')

  const permissions = this

  const methodFuncs = permissions::determineMethodFuncs(config)

  const fieldFuncs = config.fields ? permissions::ensureFuncs(config.fields) : null

  define(permissions)
    .const(METHOD_FLAGS, methodFuncs)
    .const(FIELD_FLAGS, fieldFuncs)

}
