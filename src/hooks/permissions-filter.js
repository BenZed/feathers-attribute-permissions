import { checkContext } from 'feathers-hooks-common/lib/services'
import { Forbidden } from 'feathers-errors'

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
      if (isGet && error)
        throw new Forbidden(error)

      if (!error)
        newResult.push(data)
    }

    hook.result = isGet ? newResult[0] : newResult

    return hook

  }

}
