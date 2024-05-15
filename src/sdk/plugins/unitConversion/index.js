import getConversionUnits, { getConversionAttributes } from "./getConversionUnits"

const baseConvert = (chart, unitsKey = "units", min, max) => {
  const {
    method,
    fractionDigits,
    prefix = "",
    base = "",
    divider,
  } = getConversionUnits(chart, unitsKey, { min, max })

  chart.updateAttributes({
    [`${unitsKey}ConversionMethod`]: method,
    [`${unitsKey}ConversionPrefix`]: prefix,
    [`${unitsKey}ConversionBase`]: base,
    [`${unitsKey}ConversionFractionDigits`]: fractionDigits,
    [`${unitsKey}ConversionDivider`]: divider,
  })

  const unitsStsByContext = chart.getAttribute(`${unitsKey}StsByContext`)

  chart.updateAttribute(
    `${unitsKey}ByContext`,
    Object.keys(unitsStsByContext).reduce((h, ctx) => {
      h[ctx] = getConversionAttributes(chart, unitsStsByContext[ctx].units, {
        min: unitsStsByContext[ctx].min,
        max: unitsStsByContext[ctx].max,
      })
      return h
    }, {})
  )
}

export default sdk => {
  return sdk.on("yAxisChange", (chart, min, max) => {
    baseConvert(chart, "units", min, max)
    baseConvert(chart, "dbUnits", min, max)

    chart.updateAttributes({
      min,
      max,
    })
  })
}
