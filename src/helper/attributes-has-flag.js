import is from 'is-explicit'

export default function attributesHasFlag(attributes, flag) {

  const flags = is(flag, Array) ? flag : [ flag ]

  return flags.some(f => attributes[f])
  
}
