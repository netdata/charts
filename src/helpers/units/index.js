import allUnits from "./all"
import conversableUnits, { makeConversableKey, keys as conversableKeys } from "./conversableUnits"
import scalableUnits, { keys } from "./scalableUnits"

export const unitsMissing = u => typeof allUnits.units[u] === "undefined"

const unitOrEmpty = u => (u === null || typeof u === "undefined" ? "" : u)

export const getUnitConfig = u =>
  allUnits.units[u] || {
    is_scalable: true,
    is_metric: false,
    is_binary: false,
    is_bit: false,
    print_symbol: unitOrEmpty(u),
    name: unitOrEmpty(u),
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

export const isScalable = (u = "") =>
  typeof u === "string" ? getUnitConfig(u)?.is_scalable : u?.is_scalable
export const isMetric = (u = "") =>
  typeof u === "string" ? getUnitConfig(u)?.is_metric : u?.is_metric
export const isBinary = (u = "") =>
  typeof u === "string" ? getUnitConfig(u)?.is_binary : u?.is_binary
export const isChronos = (u = "") =>
  typeof u === "string" ? getUnitConfig(u)?.is_chronos : u?.is_chronos
export const isBit = (u = "") => (typeof u === "string" ? getUnitConfig(u)?.is_bit : u?.is_bit)

export const getScales = u => {
  if (!isScalable(u)) return [[], {}]

  if (isChronos(u)) return [[...keys.chronos], scalableUnits.chronos]
  if (isBinary(u)) return [[...keys.binary], scalableUnits.binary]
  if (isBit(u)) return [[...keys.bit], scalableUnits.num]

  if (isMetric(u)) return [[...keys.num], scalableUnits.num]

  return [[...keys.decimal], scalableUnits.decimal]
}

const labelify = (base, config, long) => {
  if (!config) return base
  if (long) return typeof config.name === "undefined" ? base : config.name
  return typeof config.print_symbol === "undefined" ? base : config.print_symbol
}

export const getUnitsString = (u, prefix = "", base = "", long) => {
  if (!isScalable(u)) return labelify(base, u, long).trim()

  if (isChronos(u)) labelify(base, u, long)

  if (isMetric(u) || isBinary(u) || isBit(u))
    return `${labelify(prefix, allUnits.prefixes[prefix], long)}${labelify(base, u, long)}`.trim()

  return `${labelify(prefix, allUnits.decimal_prefixes[prefix], long)} ${labelify(base, u, long)}`.trim()
}

const converts = Object.keys(conversableKeys).reduce((acc, unit) => {
  conversableKeys[unit].forEach(scale => {
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
