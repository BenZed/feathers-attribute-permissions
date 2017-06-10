import { METHOD_FLAGS } from './symbols'
import is from 'is-explicit'

export default async function testMethodFlags(user, attributes, method, data) {

  const flags = this[METHOD_FLAGS]

  const flag = flags[method]

  let error


  if (is(flag, String, Array))
    error = !this.match(attributes, flag)

  else if (is(flag, Function))
    error = await flag(user, attributes, method, data)

  return error

}
