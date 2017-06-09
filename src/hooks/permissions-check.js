import { checkContext } from 'feathers-hooks-common/lib/services'
import { Forbidden } from 'feathers-errors'

export default function(permissions) {

  const { userEntityField } = permissions.options

  return async function(hook) {

    checkContext(hook, 'before', null, 'permissions-check')

    const { method, params, data } = hook

    const { provider } = params

    //if this isn't a find or get method, or this is no provider, we can ignore it.
    if (method === 'find' || method === 'get' || !provider)
      return

    const user = params[userEntityField]

    if (provider && !user)
      throw new Error('User not resolved, permissions could not be determined.')

    const error = await permissions.test(user, method, data)
    if (error)
      throw new Forbidden(error)
  }

}
