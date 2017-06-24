import is from 'is-explicit'

const NIL = { }

export default async function determineAttributes(hook) {

  const { params } = hook

  const { permissionsField, userIdField, userEntityField, originalField } = this.options

  const original = hook[originalField] || NIL

  const user = params[userEntityField] || NIL
  const attributes = user[permissionsField] || NIL
  const id = String(user[userIdField])

  const override =
    is.plainObject(original[permissionsField])
     ? original[permissionsField][id] || NIL
     : NIL

  return { ...attributes, ...override }

}
