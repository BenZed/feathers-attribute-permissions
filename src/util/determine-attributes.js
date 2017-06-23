import is from 'is-explicit'

const NIL = { }

export default async function determineAttributes(hook) {

  const { params, method } = hook

  const { permissionsField, userIdField, userEntityField, originalField } = this.options

  const original = hook[originalField] || NIL

  const user = params[userEntityField] || NIL
  const permissions = user[permissionsField] || NIL
  const id = String(user[userIdField])

  const override =
    is.plainObject(original[permissionsField]) &&
    is.plainObject(original[permissionsField][method])
     ? original[permissionsField][method][id] || NIL
     : NIL

  return { ...permissions, ...override }

}
