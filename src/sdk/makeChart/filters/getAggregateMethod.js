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
  "{stratum}",
  "[degF]",
])

const sumUnits = new Set(["state", "{state}", "status", "{status}"])

const averageRegex = /(%|\/operation|\/run| run|\/request)/

export default chart => {
  let unit = chart.getUnits()

  unit = unit || chart.getAttribute("contextUnit")

  if (!unit) return "avg"

  let lowerUnit = unit.toLowerCase()
  if (averageUnits.has(unit) || averageRegex.test(lowerUnit)) return "avg"

  if (sumUnits.has(unit) || sumUnits.has(lowerUnit)) return "sum"

  return "avg"
}
