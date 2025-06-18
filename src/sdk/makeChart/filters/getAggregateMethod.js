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
  "c[CPU]",
  "{rotation}/min",
  "1",
  "s",
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
  "min",
  "h",
  "{tick}",
  "Cel",
  "Hz",
  "MHz",
  "V",
  "A",
  "W",
  "dB[mW]",
  "1",
  "{stratum}",
  "Cel",
  "[degF]",
  "{rotation}/min",
])

const averageRegex = /(%|\/operation|\/run| run|\/request)/

export default chart => {
  const unit = chart.getUnits()

  if (!unit) return "avg"

  let lowerUnit = unit.toLowerCase()
  if (averageUnits.has(unit) || averageRegex.test(lowerUnit)) return "avg"

  const unitSign = chart.getUnitSign()
  if (unitSign) {
    lowerUnit = unitSign.toLowerCase()
    if (averageUnits.has(unitSign) || averageRegex.test(lowerUnit)) return "avg"
  }

  return "sum"
}
