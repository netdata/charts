import getConversionUnits from "./getConversionUnits"

const convert = (chart, unitsKey = "units", min, max) => {
  const { method, divider, units, fractionDigits } = getConversionUnits(chart, unitsKey, min, max)
  const ancestor = chart.getAncestor({ syncUnits: true })

  if (!ancestor || method === "original") {
    return chart.updateAttributes({
      [`${unitsKey}ConversionMethod`]: method,
      [`${unitsKey}ConversionDivider`]: divider,
      [`${unitsKey}Conversion`]: units,
      [`${unitsKey}ConversionFractionDigits`]: fractionDigits,
    })
  }

  const unitsConversionDivider = ancestor.getAttribute(`${unitsKey}ConversionDivider`)

  const updateChart = () => {
    chart.updateAttributes({
      [`${unitsKey}ConversionMethod`]: method,
      [`${unitsKey}ConversionDivider`]: divider,
      [`${unitsKey}Conversion`]: units,
      [`${unitsKey}ConversionFractionDigits`]: fractionDigits,
    })
  }

  if (divider > unitsConversionDivider) {
    return chart.getApplicableNodes({ syncUnits: true }).forEach(node => {
      if (node === chart) return updateChart()

      node.updateAttributes({
        [`${unitsKey}ConversionMethod`]: method,
        [`${unitsKey}ConversionDivider`]: divider,
        [`${unitsKey}Conversion`]: units,
      })
    })
  }

  updateChart()
}

export default sdk => {
  return sdk.on("yAxisChange", (chart, min, max) => {
    convert(chart, "units", min, max)
    convert(chart, "dbUnits", min, max)

    chart.updateAttributes({
      min,
      max,
    })
  })
}
