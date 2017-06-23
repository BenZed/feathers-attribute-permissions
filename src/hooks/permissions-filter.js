import { checkContext } from 'feathers-hooks-common/lib/services'
import { Forbidden } from 'feathers-errors'
import is from 'is-explicit'

import Permissions from '../permissions'

/******************************************************************************/
// Helper
/******************************************************************************/

function filterDataWithError(data, error) {

  if (!is(data, Object) || !is(error, Object))
    return error ? null : data

  const filtered = { }

  for (const key in data) {

    const value = filterDataWithError(data[key], error[key])
    if (value)
      filtered[key] = value

  }

  return filtered

}

/******************************************************************************/
// Export
/******************************************************************************/

export default function(permissions) {

  if (!is(permissions, Permissions))
    throw new Error('permissions-fitler hook must be configured with a Permissions object.')

  const { userEntityField, originalField } = permissions.options

  return async function(hook) {

    checkContext(hook, 'after', null, 'permissions-filter')

    const { method, params, result } = hook

    const { provider } = params

    const isGet = method === 'get'

    //if this isn't a find or get method, or this is no provider, we can ignore it.
    if (method !== 'find' && !isGet || !provider)
      return

    const user = params[userEntityField]

    if (provider && !user)
      throw new Error('User not resolved, permissions could not be determined.')

    const oldResult = isGet ? [result] : result
    const newResult = []

    for (const data of oldResult) {

      //permissions looks for data in hook.data rather than hook.result. this
      //just makes it universally available
      hook.data = data

      //just in case some other hook fills the original field, we set it to null so
      //it wont fuck us up
      hook[originalField] = null

      const error = await permissions.test(hook)

      const filtered = filterDataWithError(data, error)

      //a get request wont result in an error if the filtered data returns an object
      //but, if the filtered data is null, it means this document is entirely unaccessible
      //and the get request should result in an error
      if (isGet && !filtered && error)
        throw new Forbidden(is(error, String) ? error : `You cannot view document with id ${data[this.id]}`)

      else if (filtered)
        newResult.push(filtered)

      delete hook.data
    }

    hook.result = isGet ? newResult[0] : newResult

    return hook

  }

}
