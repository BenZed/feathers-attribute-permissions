import is from 'is-explicit'

export default function determineAttributes(user = {}, method, data = {}) {

  const { permissionsField : field, userIdField } = this.options

  const permissions = user[field] || { }

  const id = String(user[userIdField])

  const override =
    is(data[field], Object) &&
    is(data[field][method], Object)
      ? data[field][method][id] || { }
      : { }

  return { ...permissions, ...override }

}
