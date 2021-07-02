import getConversionUnits from "./getConversionUnits"

export default sdk => {
  return sdk.on("yAxisChange", (chart, min, max) => {
    const { method, divider, unit, fractionDigits } = getConversionUnits(chart, min, max)
    const ancestor = chart.getAncestor({ syncUnits: true })

    if (!ancestor) {
      chart.updateAttributes({
        unitsConversionMethod: method,
        unitsConversionDivider: divider,
        unit: unit,
        unitsConversionFractionDigits: fractionDigits,
      })
    }

    const { unitsConversionDivider } = ancestor.getAttributes()

    const updateChart = () => {
      chart.updateAttributes({
        unitsConversionMethod: method,
        unitsConversionDivider: divider,
        unitsConversionFractionDigits: fractionDigits,
        unit,
      })
    }

    if (divider > unitsConversionDivider) {
      return chart.getApplicableNodes({ syncUnits: true }).forEach(node => {
        if (node === chart) return updateChart()

        node.updateAttributes({
          unitsConversionMethod: method,
          unitsConversionDivider: divider,
          unit: unit,
        })
      })
    }

    updateChart()
  })
}
