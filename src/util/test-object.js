import is from 'is-explicit'

/******************************************************************************/
// Export
/******************************************************************************/

export default async function testObject(tests, attributes, hook, data) {

  let errors = false

  const dataIsPlainObject = is.plainObject(data)

  //if we've gotten here and data isn't an object, the data must be invalid
  if (!dataIsPlainObject && !is(data))
    return `Invalid value: expected an object, but got ${String(data)}`

  //if data isn't defined at all, however, it means the user isn't trying to
  //change this field, and we don't need to run permissions on it
  else if (!dataIsPlainObject)
    return errors

  for (const key in data) {

    const value = data[key]
    //don't need to check permissions on a field if a user isn't manipulating it
    if (!is(value))
      continue

    const test = tests[key]
    //don't need to check permissions if there are no permissions to check

    const error =
        is.plainObject(test) ? await testObject(test, attributes, hook, value)
      : is(test, Function)   ? await test(attributes, hook, value)

      //if it's not an object or a test, then there arn't any permission restrictions
      : false

    if (!error)
      continue

    errors = errors || {}

    errors[key] = error

  }

  return errors

}
