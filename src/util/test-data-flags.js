import is from 'is-explicit'

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

    const flag = flags[key]
    //don't need to check permissions if there are no permissions to check

    const error = is(flag, String, Array)

      ? !this.attributesHasFlag(attributes, flag)

      : is(flag, Function)

      ? await flag(attributes, hook)

      : is(flag, Object)

      ? await testDataFlags(flag, attributes, hook)

      : false

    if (!error)
      continue

    errors = errors || {}

    errors[key] = error

  }

  return errors
}
