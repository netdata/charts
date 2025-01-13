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
        min: min || unitsStsByContext[ctx].min,
        max: max || unitsStsByContext[ctx].max,
      })
      return h
    }, {})
  )
}

export default chart => {
  const convert = (min, max) => {
    baseConvert(chart, "units", min, max)
    baseConvert(chart, "dbUnits", min, max)

    chart.updateAttributes({
      min,
      max,
    })
  }

  const onConvert = (ymin, ymax) => {
    if (Array.isArray(chart.getAttribute("staticValueRange"))) {
      const [min, max] = chart.getAttribute("staticValueRange")
      convert(min, max)
      return
    }

    const result = chart.getPayload()

    const dimMinMax = result?.byDimension
      ? chart.getVisibleDimensionIds().reduce(
          (h, d) => {
            if (result.byDimension[d] && result.byDimension[d].min <= h.min)
              h.min = result.byDimension[d].min
            if (result.byDimension[d] && result.byDimension[d].max >= h.max)
              h.max = result.byDimension[d].max
            return h
          },
          { min: Infinity, max: -Infinity }
        )
      : { min: Infinity, max: -Infinity }

    if (dimMinMax.min === Infinity) {
      if (typeof ymin === "undefined" || typeof ymax === "undefined") return

      convert(ymin, ymax)

      return
    }

    convert(dimMinMax.min, dimMinMax.max)
  }

  const offVisibleDimensionsChanged = chart.on("visibleDimensionsChanged", () => onConvert())
  const offYAxisChange = chart.on("yAxisChange", onConvert)

  return () => {
    offYAxisChange()
    offVisibleDimensionsChanged()
  }
}
