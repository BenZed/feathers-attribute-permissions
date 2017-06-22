import is from 'is-explicit'
import attributesHasFlag from './attributes-has-flag'

export default function fieldEditView(editFlags, viewFlags, msg = true) {

  editFlags = is(editFlags, Array) ? editFlags : [ editFlags ]
  viewFlags = is(viewFlags, Array) ? viewFlags : [ viewFlags ]

  if (editFlags.length > 0 && !is.arrayOf(editFlags, String))
    throw new Error('editFlags must be an array of strings')

  if (viewFlags.length > 0 && !is.arrayOf(viewFlags, String))
    throw new Error('viewFlags must be an array of strings')

  return (attributes, hook) =>
    hook.method === 'find' || hook.method === 'get'
      ? attributesHasFlag(attributes, viewFlags) ? false : msg
      : attributesHasFlag(attributes, editFlags) ? false : msg

}
