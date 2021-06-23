import getConversionUnits from "./getConversionUnits"

export default sdk => {
  return sdk.on("yAxisChange", (chart, min, max) => {
    const { method, divider, unit, fractionDigits } = getConversionUnits(chart, min, max)
    const ancestor = chart.getAncestor({ syncUnits: true })

    if (!ancestor) {
      chart.setAttributes({
        unitsConversionMethod: method,
        unitsConversionDivider: divider,
        unit: unit,
        unitsConversionFractionDigits: fractionDigits,
      })
      return chart.trigger("convertedValuesChange")
    }

    const { unitsConversionDivider } = ancestor.getAttributes()

    const updateChart = () => {
      chart.setAttributes({
        unitsConversionMethod: method,
        unitsConversionDivider: divider,
        unitsConversionFractionDigits: fractionDigits,
        unit,
      })
      return chart.trigger("convertedValuesChange")
    }

    if (divider > unitsConversionDivider) {
      return chart.getApplicableNodes({ syncUnits: true }).forEach(node => {
        if (node === chart) return updateChart()

        node.setAttributes({
          unitsConversionMethod: method,
          unitsConversionDivider: divider,
          unit: unit,
        })
        chart.trigger("convertedValuesChange")
      })
    }

    updateChart()
  })
}
