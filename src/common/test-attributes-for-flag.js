import { attributesHasFlag } from '../util'
import is from 'is-explicit'

export default function testAttributesForFlag(flag, error = true) {

  if (error !== true && !is(error, String))
    throw new Error('error message, if defined, must be a string.')

  return attributes =>
    attributesHasFlag(attributes, flag)
      ? false
      : error

}
