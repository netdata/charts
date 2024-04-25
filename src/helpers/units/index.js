import allUnits from "./all"
import conversableUnits, { makeConversableKey } from "./conversableUnits"
import scalableUnits, { keys } from "./scalableUnits"

export const unitsMissing = u => typeof allUnits.units[u] === "undefined"
export const getUnitConfig = u =>
  allUnits.units[u] || {
    name: u,
    is_additive: true,
    is_metric: true,
    is_binary: false,
  }

const findCurly = u => {
  if (allUnits.units[`{${u}}`]) return `{${u}}`

  if (!/\//g.test(u)) return u

  const [first, ...last] = u.split("/")
  if (allUnits.units[`{${first}}/${last.join("/")}`]) return `{${first}}/${last.join("/")}`
  if (allUnits.units[`${first}/{${last.join("/")}}`]) return `${first}/{${last.join("/")}}`

  return u
}

export const getAlias = u => allUnits.aliases[u] || (allUnits.units[u] ? u : findCurly(u))

export const isAdditive = u => getUnitConfig(u).is_additive
export const isMetric = u => getUnitConfig(u).is_metric
export const isBinary = u => getUnitConfig(u).is_binary

export const getScales = u => {
  if (!isAdditive(u)) return [[], {}]
  if (isBinary(u)) return [keys.binary, scalableUnits.binary]
  if (!isMetric(u)) return [keys.decimal, scalableUnits.decimal]

  return [keys.num, scalableUnits.num]
}

const labelify = (base, config, long) => {
  if (!config || !base) return base
  if (long) return config.name || base
  return config.print_symbol || base
}

export const getUnitsString = (u, prefix = "", base = "", long) => {
  if (!isAdditive(u)) return base

  if (!isMetric(u))
    return `${labelify(prefix, allUnits.decimal_prefixes[prefix], long)} ${labelify(base, u, long)}`

  return `${labelify(prefix, allUnits.prefixes[prefix], long)}${long || !allUnits.prefixes[prefix]?.is_binary ? " " : ""}${labelify(base, u, long)}`
}

const converts = Object.keys(conversableUnits).reduce((acc, unit) => {
  Object.keys(conversableUnits[unit]).forEach(scale => {
    acc[makeConversableKey(unit, scale)] = (chart, value) =>
      conversableUnits[unit][scale].convert(value, chart)
  })
  return acc
}, {})

const byMethod = {
  ...converts,
  original: (chart, value) => value,
  divide: (chart, value, divider) => value / divider,
  adjust: (chart, value, make) => make(value),
}

export default (chart, method, value, divider) => {
  const func = byMethod[method] || byMethod.original
  return func(chart, value, divider)
}
