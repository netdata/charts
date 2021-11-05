import getConversionUnits from "./getConversionUnits"

export default sdk => {
  return sdk.on("yAxisChange", (chart, min, max) => {
    const { method, divider, units, fractionDigits } = getConversionUnits(chart, min, max)
    const ancestor = chart.getAncestor({ syncUnits: true })

    if (!ancestor) {
      return chart.updateAttributes({
        unitsConversionMethod: method,
        unitsConversionDivider: divider,
        unitsConversion: units,
        unitsConversionFractionDigits: fractionDigits,
        min,
        max,
      })
    }

    const { unitsConversionDivider } = ancestor.getAttributes()

    const updateChart = () => {
      chart.updateAttributes({
        unitsConversionMethod: method,
        unitsConversionDivider: divider,
        unitsConversionFractionDigits: fractionDigits,
        unitsConversion: units,
        min,
        max,
      })
    }

    if (divider > unitsConversionDivider) {
      return chart.getApplicableNodes({ syncUnits: true }).forEach(node => {
        if (node === chart) return updateChart()

        node.updateAttributes({
          unitsConversionMethod: method,
          unitsConversionDivider: divider,
          unitsConversion: units,
          min,
          max,
        })
      })
    }

    updateChart()
  })
}
