import React, { useLayoutEffect, useRef, useState } from "react"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue, useChart, useImmediateListener } from "@/components/provider"
import { unregister } from "@/helpers/makeListeners"
import { resolveLegendMode } from "./mode"
import DirectLabels from "./directLabels"
import LegendTable from "./legendTable"

const placeableLibraries = { dygraph: true, uplot: true }

const useWidth = ref => {
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => setWidth(Math.round(el.getBoundingClientRect().width))
    measure()

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure)
      return () => window.removeEventListener("resize", measure)
    }

    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return width
}

const getCount = chart => chart.getDimensionIds()?.length || 0
const getVisibleCount = chart => chart.getVisibleDimensionIds?.()?.length ?? getCount(chart)

const useDimensionCounts = () => {
  const chart = useChart()
  const [count, setCount] = useState(() => getCount(chart))
  const [visibleCount, setVisibleCount] = useState(() => getVisibleCount(chart))

  useImmediateListener(() => {
    const update = () => {
      setCount(getCount(chart))
      setVisibleCount(getVisibleCount(chart))
    }

    return unregister(
      chart.on("dimensionChanged", update),
      chart.on("visibleDimensionsChanged", update)
    )
  }, [chart])

  return { count, visibleCount }
}

export const useResolvedLegendMode = ({ width, hasFooter }) => {
  const { count, visibleCount } = useDimensionCounts()
  const legend = useAttributeValue("legend")
  const legendLayout = useAttributeValue("legendLayout")
  const sparkline = useAttributeValue("sparkline")
  const chartType = useAttributeValue("chartType")
  const chartLibrary = useAttributeValue("chartLibrary")

  return resolveLegendMode({
    width,
    count,
    visibleCount,
    legendLayout,
    legend,
    sparkline,
    hasFooter,
    heatmap: chartType === "heatmap",
    chartType,
    canPlaceDirect: !!placeableLibraries[chartLibrary],
  })
}

const Body = ({ uiName, hasFooter = true, children }) => {
  const chart = useChart()
  const ref = useRef(null)
  const width = useWidth(ref)
  const showingInfo = useAttributeValue("showingInfo")
  const mode = useResolvedLegendMode({ width, hasFooter })

  useLayoutEffect(() => {
    if (chart.getAttribute("legendMode") !== mode) chart.updateAttribute("legendMode", mode)
  }, [chart, mode])

  const labelled = mode === "direct" || mode === "live"
  const side = !showingInfo && (labelled || mode === "table")

  return (
    <Flex
      ref={ref}
      flex
      position="relative"
      overflow="hidden"
      gap={side && mode === "table" ? 4 : 0}
      data-testid="modernBody"
      data-legend={mode}
    >
      {children}
      {side && labelled && <DirectLabels uiName={uiName} />}
      {side && mode === "table" && <LegendTable />}
    </Flex>
  )
}

export default Body
