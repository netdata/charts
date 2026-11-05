import React, { memo, useEffect, useMemo, useState } from "react"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"
import { getConversionAttributes } from "@/helpers/unitConversion/getConversionUnits"
import dimensionColors from "@/sdk/makeChart/theme/dimensionColors"
import { ValueUnitGrid } from "@/components/line/dimensions/valueWithUnit"
import SparklineCanvas from "./sparklineCanvas"
import {
  getSparklineBatchAttributes,
  getSparklineBatchDimensions,
  getSparklineDataFetcher,
} from "./sparklineData"

const valueWidth = 144

const Sparkline = memo(({ dimension, dimensions }) => {
  const after = useAttributeValue("after")
  const before = useAttributeValue("before")
  const points = useAttributeValue("points")
  const renderedAt = useAttributeValue("renderedAt")
  const liveAnchor = useAttributeValue("liveAnchor")
  const aggregationMethod = useAttributeValue("correlate.aggregation", "average")
  const theme = useAttributeValue("theme")
  const chart = useChart()
  const getData = useMemo(() => getSparklineDataFetcher(chart), [chart])
  const batchDimensions = useMemo(
    () => getSparklineBatchDimensions(dimension, dimensions),
    [dimension, dimensions]
  )
  const attrs = useMemo(
    () =>
      getSparklineBatchAttributes(chart, batchDimensions, {
        after,
        before,
        points,
        renderedAt,
        liveAnchor,
        aggregationMethod,
      }),
    [after, aggregationMethod, batchDimensions, before, chart, liveAnchor, points, renderedAt]
  )
  const [series, setSeries] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    setSeries(null)

    getData(attrs, { signal: controller.signal })
      .then(seriesByDimension => setSeries(seriesByDimension.get(dimension.dimension) || null))
      .catch(error => {
        if (error.name !== "AbortError") setSeries(null)
      })

    return () => controller.abort()
  }, [attrs, dimension.dimension, getData])

  const formatted = useMemo(() => {
    if (!series || series.latest === null) return { value: "-", unit: "" }

    const unitAttributes = getConversionAttributes(chart, series.unit, {
      min: series.latest,
      max: series.latest,
    })

    return {
      value: chart.getConvertedValue(series.latest, { unitAttributes }),
      unit: chart.getUnitSign({ unitAttributes }),
    }
  }, [chart, series])
  const color = useMemo(() => dimensionColors[11][chart.getThemeIndex()], [chart, theme])

  return (
    <Flex alignItems="center" gap={1} width={{ min: "0px", base: "100%" }}>
      <Flex
        flex={false}
        basis={`${valueWidth}px`}
        width={`${valueWidth}px`}
        title={[formatted.value, formatted.unit].filter(Boolean).join(" ")}
      >
        <ValueUnitGrid value={formatted.value} unit={formatted.unit} strong />
      </Flex>
      <Flex flex width={{ min: "0px" }}>
        <SparklineCanvas values={series?.values || []} color={color} />
      </Flex>
    </Flex>
  )
})

export default Sparkline
