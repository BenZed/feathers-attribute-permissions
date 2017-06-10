import { checkContext } from 'feathers-hooks-common/lib/services'
import { Forbidden } from 'feathers-errors'
import is from 'is-explicit'

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

  const { userEntityField } = permissions.options

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

      const error = await permissions.test(user, method, data)

      const filtered = filterDataWithError(data, error)

      //a get request wont result in an error if the filtered data returns an object
      //but, if the filtered data is null, it means this document is entirely unaccessible
      //and the get request should result in an error
      if (isGet && !filtered && error)
        throw new Forbidden(error)

      else if (filtered)
        newResult.push(filtered)
    }

    hook.result = isGet ? newResult[0] : newResult

    return hook

  }

}
