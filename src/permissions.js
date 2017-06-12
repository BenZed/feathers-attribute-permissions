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

const VALID_METHODS = [ 'find', 'get', 'create', 'remove', 'patch', 'update']

/******************************************************************************/
// Main
/******************************************************************************/

export default class Permissions {

  constructor(config, options = {}) {

    if (!is(options, Object))
      throw new Error('Options, if provided, is expected to be an object.')

    const { userEntityField, userIdField, permissionsField } = { ...DEFAULT_OPTIONS, ...options }

    define(this)
    .const.enum('options', { userEntityField, userIdField, permissionsField })
    .const.enum('check', permissionsCheck(this))
    .const.enum('filter', permissionsFilter(this))

    this::parseConfig(config)

  }

  async test(hook) {

    const { method } = hook

    if (!VALID_METHODS.includes(method))
      throw new Error('method must be one of: ' + VALID_METHODS)

    const attributes = this::determineAttributes(hook)

    let errors = await this::testMethodFlags(attributes, hook)

    if (!errors && this[DATA_FLAGS])
      errors = await this::testDataFlags(this[DATA_FLAGS], attributes, hook)

    return errors || false

  }

  async pass(hook) {

    return ! await this.test(hook)

  }

  attributesHasFlag(attributes = {}, flag) {

    const flags = is(flag, Array) ? flag : [ flag ]

    return flags.some(f => attributes[f])

  }

}
