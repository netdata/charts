import allUnits from "./all"
import conversableUnits, {
  isCompactDurationUnit,
  makeConversableKey,
  keys as conversableKeys,
} from "./conversableUnits"
import scalableUnits, { keys } from "./scalableUnits"

export const unitsMissing = u => {
  const alias = allUnits.aliases[u] || u

  return typeof allUnits.units[alias] === "undefined"
}

const unitOrEmpty = u => (u === null || typeof u === "undefined" ? "" : u)

export const getUnitConfig = u => {
  const alias = allUnits.aliases[u] || u

  return (
    allUnits.units[alias] || {
      is_scalable: true,
      is_metric: false,
      is_binary: false,
      is_bit: false,
      print_symbol: unitOrEmpty(alias),
      name: unitOrEmpty(alias),
    }
  )
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

export const getNormalizedUnit = u => {
  const alias = getAlias(u)
  const config = getUnitConfig(alias)

  if (config.normalized_unit) {
    return config.normalized_unit
  }

  if (config.is_scalable && config.base_unit && config.prefix_symbol) {
    return config.base_unit
  }

  return alias
}

export const getNormalizedUnitConfig = u => getUnitConfig(getNormalizedUnit(u))

export const isScalable = (u = "") =>
  typeof u === "string" ? getUnitConfig(u)?.is_scalable : u?.is_scalable
export const isMetric = (u = "") =>
  typeof u === "string" ? getUnitConfig(u)?.is_metric : u?.is_metric
export const isBinary = (u = "") =>
  typeof u === "string" ? getUnitConfig(u)?.is_binary : u?.is_binary
export const isChronos = (u = "") =>
  typeof u === "string" ? getUnitConfig(u)?.is_chronos : u?.is_chronos

export const isBit = (u = "") => (typeof u === "string" ? getUnitConfig(u)?.is_bit : u?.is_bit)
export const isDecimalByte = (u = "") =>
  !!(typeof u === "string" ? getUnitConfig(u)?.is_decimal_byte : u?.is_decimal_byte)

export const getExponent = (u = "") =>
  typeof u === "string" ? getUnitConfig(u)?.exponent : u?.exponent

export const getScales = u => {
  if (!isScalable(u)) return [[], {}]

  if (isChronos(u)) return [[...keys.chronos], scalableUnits.chronos]
  if (isBinary(u)) return [[...keys.binary], scalableUnits.binary]
  if (isDecimalByte(u)) return [[...keys.decimalBytes], scalableUnits.decimalBytes]
  if (isBit(u)) return [[...keys.bit], scalableUnits.num]

  if (isMetric(u)) return [[...keys.num], scalableUnits.num]

  return [[...keys.decimal], scalableUnits.decimal]
}

export const unitLabelModes = {
  auto: "auto",
  compact: "compact",
  full: "full",
  scale: "scale",
}

const compactDenominators = {
  operation: "op",
  request: "req",
  run: "run",
}

const compactDenominatorPattern = new RegExp(
  `/\\{(${Object.keys(compactDenominators).join("|")})\\}`
)

const hasCompactDenominator = u => {
  const config = typeof u === "string" ? getUnitConfig(u) : u || {}
  const unit = typeof u === "string" ? u : config.symbol || ""

  return (
    compactDenominatorPattern.test(unit) || compactDenominatorPattern.test(config.base_unit || "")
  )
}

export const getUnitLabelMode = u => {
  if (!isScalable(u)) return unitLabelModes.full
  if (hasCompactDenominator(u)) return unitLabelModes.compact
  if (isChronos(u) || isMetric(u) || isBinary(u) || isDecimalByte(u) || isBit(u))
    return unitLabelModes.full

  return unitLabelModes.scale
}

const compactCompoundUnit = label =>
  label.replace(/\/(operation|request|run)\b/g, (match, denominator) => {
    const compact = compactDenominators[denominator]

    return compact ? `/${compact}` : match
  })

const applyUnitLabelMode = (label, mode, long) =>
  !long && mode === unitLabelModes.compact ? compactCompoundUnit(label) : label

const labelify = (base, config, long) => {
  if (!config) return base

  if (typeof config === "string") {
    const resolved = getUnitConfig(config)
    const resolvedBase = allUnits.units[base]

    if (resolvedBase) return long ? resolvedBase.name : resolvedBase.print_symbol

    const display = long ? resolved.name : resolved.print_symbol
    if (display === "") return ""
    return base || display
  }

  if (long) return typeof config.name === "undefined" ? base : config.name
  return typeof config.print_symbol === "undefined" ? base : config.print_symbol
}

const resolveUnitLabelMode = (u, mode) =>
  mode && mode !== unitLabelModes.auto ? mode : getUnitLabelMode(u)

export const getUnitsString = (u, prefix = "", base = "", long, { mode } = {}) => {
  if (isCompactDurationUnit(base)) return ""

  if (!isScalable(u)) return labelify(base, u, long).trim()

  if (isChronos(u)) return labelify(base, u, long)

  const resolvedMode = resolveUnitLabelMode(u, mode)

  if (resolvedMode === unitLabelModes.scale) {
    return labelify(prefix, allUnits.decimal_prefixes[prefix], long).trim()
  }

  if (base === "[CPU]" && !long) {
    if (prefix === "m" || prefix === "c") return `${prefix}CPU`

    return `${labelify(prefix, allUnits.prefixes[prefix], long)}${labelify(
      base,
      u,
      long
    )}`.trim()
  }

  if (isDecimalByte(u))
    return applyUnitLabelMode(
      `${labelify(
        prefix,
        allUnits.prefixes[prefix] || allUnits.decimal_prefixes[prefix],
        long
      )}${labelify(base, u, long)}`.trim(),
      resolvedMode,
      long
    )

  if (isMetric(u) || isBinary(u) || isBit(u))
    return applyUnitLabelMode(
      `${labelify(prefix, allUnits.prefixes[prefix], long)}${labelify(
        base,
        u,
        long
      )}`.trim(),
      resolvedMode,
      long
    )

  return applyUnitLabelMode(
    `${labelify(prefix, allUnits.decimal_prefixes[prefix], long)} ${labelify(
      base,
      u,
      long
    )}`.trim(),
    resolvedMode,
    long
  )
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
