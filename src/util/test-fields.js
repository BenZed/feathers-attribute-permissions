
export default async function testDataFlags(flags, attributes, hook) {

  let errors = false

  const { data } = hook
  if (!data)
    return

  for (const key in data) {

    const value = data[key]
    //don't need to check permissions on a field if a user isn't manipulating it
    if (!value)
      continue

    const method = flags[key]
    //don't need to check permissions if there are no permissions to check

    const error = await method(attributes, hook, value)
    if (!error)
      continue

    errors = errors || {}

    errors[key] = error

  }

  return errors
}
