import { checkContext } from 'feathers-hooks-common'
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
    throw new Error('permissions-filter hook must be configured with a Permissions object.')

  const { userEntityField, originalField } = permissions.options

  return async function(hook) {

    checkContext(hook, 'after', null, 'permissions-filter')

    const { method, params = {}, result, service } = hook

    const { provider } = params
    //if there is no provider, we don't need to filter anything
    if (!provider)
      return

    const user = params[userEntityField]
    if (provider && !user)
      throw new Error('User not resolved, permissions could not be determined.')

    const isPaginated = is.plainObject(result) &&
      'data' in result &&
      // Handles situations where non-paginated result is a single doc with a 'data' field
      service.id in result === false

    const data = isPaginated ? result.data : result

    const isArray = is(data, Array)
    const every = isArray ? data : [ data ]
    let permitted = []

    for (const doc of every) {

      //permissions looks for data in hook.data rather than hook.result.
      hook.data = doc

      //Need to get the original document in case it has override permissions
      //wrapped in a try/catch in case the doc doesn't exist
      try {
        hook[originalField] = method !== 'create'
          ? await service.get(doc[service.id])
          : null

      } catch (err) {
        hook[originalField] = null
      }

      const error = await permissions.test(hook)

      const filtered = filterDataWithError(doc, error)

      // get methods trying to return a non-existant doc result in an error. To
      // remain consistent, get methods trying to return a forbidden doc should
      // do the same.
      if (method === 'get' && !filtered && error)
        throw new Forbidden(is(error, String) ? error : `You cannot view document with id ${doc[service.id]}`)

      else if (filtered)
        permitted.push(filtered)

      delete hook.data
    }

    if (!isArray)
      permitted = permitted[0]

    if (isPaginated) {
      result.data = permitted
      hook.result = result
    } else
      hook.result = permitted

    return hook

  }

}
