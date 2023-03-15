const averageUnits = new Set([
  "%",
  "percentage",
  "percent",
  "rotations/min",
  "ratio",
  "seconds",
  "seconds ago",
  "milliseconds",
  "millisec",
  "ms",
  "log2 s",
  "minutes",
  "hours",
  "interval",
  "ticks",
  "celsius",
  "c",
  "mhz",
  "hz",
  "volts",
  "kwh",
  "ampere",
  "amps",
  "dbm",
  "value",
  "stratum",
  "units",
  "watt",
  "temperature",
  "random number",
  "rpm",
  "quadro",
  "adv/item",
  "multiplier",
  "geforce",
])

const averageRegex = /(%|\/operation|\/run| run|\/request)/

export default chart => {
  const unit = chart.getUnits()

  if (!unit) return "sum"

  let lowerUnit = unit.toLowerCase()
  if (averageUnits.has(lowerUnit) || averageRegex.test(lowerUnit)) return "avg"

  const unitSign = chart.getUnitSign()
  lowerUnit = unitSign.toLowerCase()
  if (averageUnits.has(lowerUnit) || averageRegex.test(lowerUnit)) return "avg"

  return "sum"
}
