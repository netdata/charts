const averageUnits = new Set([
  "%",
  "c[CPU]",
  "{rotation}/min",
  "1",
  "s",
  "ms",
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
  lowerUnit = unitSign.toLowerCase()
  if (averageUnits.has(unitSign) || averageRegex.test(lowerUnit)) return "avg"

  return "sum"
}
