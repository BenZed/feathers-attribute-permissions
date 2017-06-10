import is from 'is-explicit'

export default async function testDataFlags(flags, user, attributes, method, data) {

  let errors = false

  for (const key in data) {

    const value = data[key]
    //don't need to check permissions on a field if a user isn't manipulating it
    if (!value)
      continue

    const flag = flags[key]
    //don't need to check permissions if there are no permissions to check

    const error = is(flag, String, Array)

      ? !this.match(attributes, flag)

      : is(flag, Function)

      ? await flag(user, attributes, method, data)

      : is(flag, Object)

      ? await testDataFlags(flag, user, attributes, method, value)

      : false

    if (!error)
      continue

    errors = errors || {}

    errors[key] = error

  }

  return errors
}

// export default async function testFlags(flags, attributes, key, params) {
//
//   let errors = false
//
//   const flag = flags[key]
//
//   if (is(flag, Object)) for (const key in flag) {
//     const error = testFlags(flag[key], attributes, key, params)
//     if (!error)
//       continue
//
//     errors = errors || {}
//
//     errors[key] = error
//
//   } else if (is(flag, String, Array))
//     errors = this.match(attributes, flag)
//
//   else if (is(flag, Function))
//     errors = await flag(attributes, key, params)
//
//   return errors
//
// }
