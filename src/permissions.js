import { permissionsCheck, permissionsFilter } from './hooks'
import { parseConfig, testObject, HANDLERS, determineAttributes } from './util'

import is from 'is-explicit'
import define from 'define-utility'

/******************************************************************************/
// Helper
/******************************************************************************/

const DEFAULT_OPTIONS = {
  userEntityField: 'user',
  userIdField: '_id',
  originalField: 'original',
  permissionsField: 'permissions',
}

const VALID_METHODS = [ 'find', 'get', 'create', 'remove', 'patch', 'update']

/******************************************************************************/
// Main
/******************************************************************************/

export default class Permissions {

  constructor(config, options = {}) {

    if (!is.plainObject(options))
      throw new Error('Options, if provided, is expected to be a plain object.')

    const { userEntityField, userIdField, permissionsField, originalField } = { ...DEFAULT_OPTIONS, ...options }

    define(this)
    .const.enum('options', { userEntityField, userIdField, permissionsField, originalField })
    .const.enum('check', permissionsCheck(this))
    .const.enum('filter', permissionsFilter(this))

    this::parseConfig(config)

  }

  async test(hook) {

    const { data, method } = hook

    if (!VALID_METHODS.includes(method))
      throw new Error('method must be one of: ' + VALID_METHODS)

    const attributes = await this::determineAttributes(hook)

    const test = this[HANDLERS][method]

    const errors = is.plainObject(test)
      ? await testObject(test, attributes, hook, data)
      : await test(attributes, hook, data)

    return errors || false

  }

  async pass(hook) {
    return ! await this.test(hook)
  }

}
