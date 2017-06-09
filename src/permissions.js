import { permissionsCheck, permissionsFilter } from './hooks'
import { parseConfig, testDataFlags, METHOD_FLAGS, DATA_FLAGS } from './util'

import is from 'is-explicit'
import define from 'define-utility'

/******************************************************************************/
// Helper
/******************************************************************************/

const DEFAULT_OPTIONS = {
  userEntityField: 'user',
  userIdField: '_id',
  userPermissionsField: 'permissions',
  documentPerssionsField: 'permissions'
}

const DATA_METHODS = [ 'patch', 'update', 'create' ]

// const VIEW_METHODS = [ 'find', 'get' ]

/******************************************************************************/
// Main
/******************************************************************************/

export default class Permissions {

  constructor(config, options = {}) {

    /**************************************************************************/
    // Apply Config
    /**************************************************************************/
    define(this)
    .const.enum('options', { ...DEFAULT_OPTIONS, ...options })
    .const.enum('check', permissionsCheck(this))
    .const.enum('filter', permissionsFilter(this))

    this::parseConfig(config)
  }

  async test(user, method, data) {

    const flag = this[METHOD_FLAGS][method]

    let result = false

    if (is(flag, String) && !this.userHasFlag(user, flag))
      result = true

    else if (is(flag, Function))
      result = await flag(user, method, data)

    if (!result && DATA_METHODS.includes(method) && data && this[DATA_FLAGS])
      result = await this::testDataFlags(user, method, data)

    return result ? is(result, String) ? result : `Cannot ${method} this service.` : false

  }

  async pass(user, method, data) {

    return ! await this.test(user, method, data)

  }

  userHasFlag(user, flag) {

    const { userPermissionsField: field } = this.options

    return is(user, Object) && is(user[field], Object) && user[field][flag]

  }

}
