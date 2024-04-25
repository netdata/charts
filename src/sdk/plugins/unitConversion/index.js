import getConversionUnits from "./getConversionUnits"

const convert = (chart, unitsKey = "units", min, max) => {
  const {
    method,
    divider,
    units,
    fractionDigits,
    prefix = "",
    base = "",
  } = getConversionUnits(chart, unitsKey, min, max)

  chart.updateAttributes({
    [`${unitsKey}ConversionMethod`]: method,
    [`${unitsKey}ConversionDivider`]: divider,
    [`${unitsKey}Conversion`]: units,
    [`${unitsKey}ConversionPrefix`]: prefix,
    [`${unitsKey}ConversionBase`]: base,
    [`${unitsKey}ConversionFractionDigits`]: fractionDigits,
  })
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
