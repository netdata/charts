import conversableUnits, { makeConversableKey } from "./conversableUnits"

const converts = Object.keys(conversableUnits).reduce((acc, unit) => {
  Object.keys(conversableUnits[unit]).forEach(scale => {
    acc[makeConversableKey(unit, scale)] = (chart, value) =>
      conversableUnits[unit][scale].convert(value)
  })
  return acc
}, {})

const byMethod = {
  ...converts,
  original: (chart, value) => value,
  divide: (chart, value, divider) => value / divider,
}

export default (chart, method, value, divider) => {
  const func = byMethod[method] || byMethod.original
  return func(chart, value, divider)
}
