import { METHOD_FLAGS } from './symbols'

export default async function testMethodFlags(attributes, hook) {

  const { method } = hook

  const flags = this[METHOD_FLAGS]

  const func = flags[method]

  const error = await func(attributes, hook)

  return error

}
