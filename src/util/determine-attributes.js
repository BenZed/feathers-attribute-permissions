import is from 'is-explicit'

export default function determineAttributes(hook) {

  const { params, data = {}, method } = hook

  const { permissionsField : field, userIdField, userEntityField } = this.options

  const user = params[userEntityField] || { }

  const permissions = user[field] || { }

  const id = String(user[userIdField])

  const override =
    is(data[field], Object) &&
    is(data[field][method], Object)
      ? data[field][method][id] || { }
      : { }

  return { ...permissions, ...override }

}
