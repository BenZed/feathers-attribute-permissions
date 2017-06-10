import { permissionsCheck, permissionsFilter } from './hooks'
import { parseConfig, testDataFlags, testMethodFlags, determineAttributes,
 DATA_FLAGS } from './util'

import is from 'is-explicit'
import define from 'define-utility'

/******************************************************************************/
// Helper
/******************************************************************************/

const DEFAULT_OPTIONS = {
  userEntityField: 'user',
  userIdField: '_id',
  permissionsField: 'permissions',
}

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

    const attributes = this::determineAttributes(user, method, data)

    let errors = await this::testMethodFlags(user, attributes, method, data)

    if (!errors && data && this[DATA_FLAGS])
      errors = await this::testDataFlags(this[DATA_FLAGS], user, attributes, method, data)

    return errors

  }

  async pass(user, method, data) {

    return await ! this.test(user, method, data)

  }

  match(attributes = {}, flag) {

    const flags = is(flag, Array) ? flag : [ flag ]

    return flags.some(f => attributes[f])

  }

}
