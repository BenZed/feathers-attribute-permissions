import is from 'is-explicit'
import { METHOD_FLAGS, DATA_FLAGS } from './symbols'

import define from 'define-utility'

/******************************************************************************/
// Defailts
/******************************************************************************/

const allPass = {
  find: false,
  get: false,
  patch: false,
  update: false,
  create: false,
  remove: false
}

/******************************************************************************/
// Helper
/******************************************************************************/

function methodFlagsFromString(str) {

  return {
    find: str + '-view',
    get: str + '-view',
    update: str + '-edit',
    patch: str + '-edit',
    create: str + '-create',
    remove: str + '-remove'
  }

}

function methodFlagsFromFunction(func) {
  return {
    find: func,
    get: func,
    update: func,
    patch: func,
    create: func,
    remove: func
  }
}

function methodFlagsFromObject(config) {

  const { flag, view, edit, find, get, update, patch, create, remove } = config

  return is(flag) ? determineMethods(flag) : {
    find: find || view,
    get: get || view,
    update: update || edit,
    patch: patch || edit,
    create,
    remove
  }

}

function determineMethods(flags) {

  const permissions = this

  const methods = is(flags, String) ? permissions::methodFlagsFromString(flags)
    : is(flags, Function) ? permissions::methodFlagsFromFunction(flags)
    : is(flags, Object) ? permissions::methodFlagsFromObject(flags)
    : { }

  return { ...allPass, ...methods}

}

/******************************************************************************/
// Exports
/******************************************************************************/

export default function parseConfig(config) {

  const permissions = this

  const methodFlags = permissions::determineMethods(config)

  const dataFlags = is(config, Object) ? config.data : null

  define(permissions)
    .const(METHOD_FLAGS, methodFlags)
    .const(DATA_FLAGS, dataFlags)

}
