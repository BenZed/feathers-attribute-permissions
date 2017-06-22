import is from 'is-explicit'

const NIL = { }

export default function determineAttributes(hook) {

  const { params, data = {}, method } = hook

  const { permissionsField, userIdField, userEntityField } = this.options

  const user = params[userEntityField] || NIL

  const permissions = user[permissionsField] || NIL

  const id = String(user[userIdField])

  const override =
    is(data[permissionsField], Object)         &&
    is(data[permissionsField][method], Object)
     ? data[permissionsField][method][id]      || NIL
     : NIL

  return { ...permissions, ...override }

}
