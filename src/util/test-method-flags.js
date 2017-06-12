import { METHOD_FLAGS } from './symbols'
import is from 'is-explicit'

export default async function testMethodFlags(attributes, hook) {

  const { method } = hook

  const flags = this[METHOD_FLAGS]

  const flag = flags[method]

  let error

  if (is(flag, String, Array))
    error = !this.attributesHasFlag(attributes, flag)

  else if (is(flag, Function))
    error = await flag(attributes, hook)

  return error

}
