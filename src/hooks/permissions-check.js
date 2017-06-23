import { checkContext } from 'feathers-hooks-common/lib/services'
import { Forbidden } from 'feathers-errors'
import is from 'is-explicit'
import Permissions from '../permissions'

/******************************************************************************/
// Helper
/******************************************************************************/

function getNameOfService(service, app) {

  for (const name in app.services) {
    const other = app.services[name]
    if (other === service)
      return name

  }

  return null
}

function describeError(error, method, name, msg = `You cannot ${method} ${name}.`) {

  if (!is(error, Object))
    return is(error, String) ? error : msg

  const descriptions = {}

  for (const key in error)
    descriptions[key] = describeError(error[key], method, name, `You cannot ${method} field '${key}'.`)

  return descriptions
}

/******************************************************************************/
// Export
/******************************************************************************/

export default function(permissions) {

  if (!is(permissions, Permissions))
    throw new Error('permissions-fitler hook must be configured with a Permissions object.')

  const { userEntityField, originalField } = permissions.options

  return async function(hook) {

    checkContext(hook, 'before', null, 'permissions-check')

    const { method, params, id } = hook

    const { provider } = params

    //if this isn't a find or get method, or this is no provider, we can ignore it.
    if (method === 'find' || method === 'get' || !provider)
      return

    const user = params[userEntityField]

    if (provider && !user)
      throw new Error('User not resolved, permissions could not be determined.')

    //update and patch methods are going to need the original document we're editing
    //for comparing
    hook[originalField] = method === 'update' || method === 'patch'
      ? await this.get(id)
      : null

    const error = await permissions.test(hook)

    if (error) {
      const serviceName = getNameOfService(this, hook.app)
      const errors = describeError(error, method, serviceName)

      throw new Forbidden(is(errors, String) ? errors : { errors })
    }
  }

}
