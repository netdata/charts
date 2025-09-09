import React, { memo, useMemo } from "react"
import HeadlessChart from "@/components/headlessChart"
import { Line } from "@/components/line"
import { useChart, useAttributeValue } from "@/components/provider"
import dimensionColors from "@/sdk/makeChart/theme/dimensionColors"

const Sparkline = memo(({ dimension, contextName }) => {
  const after = useAttributeValue("after")
  const before = useAttributeValue("before")
  const overlays = useAttributeValue("overlays")
  const host = useAttributeValue("host")
  const points = useAttributeValue("points")
  const chart = useChart()

  return (
    <HeadlessChart
      contextScope={useMemo(() => [contextName], [contextName])}
      dimensions={useMemo(() => [dimension.dimensionName], [dimension.dimensionName])}
      nodesScope={useMemo(() => [dimension.nodeId], [dimension.nodeId])}
      after={after}
      before={before}
      sdk={chart.sdk}
      height={40}
      sparkline
      host={host}
      points={points}
      hasToolbox={false}
      hasHoverPopover={false}
      expandable={false}
      chartType="stacked"
      showAnomalies={false}
      showAnnotations={false}
      colors={dimensionColors[11]}
      overlays={useMemo(
        () => ({
          ...(!!overlays?.highlight && { highlight: overlays?.highlight }),
          latestValue: { type: "latestValue" },
        }),
        [overlays]
      )}
    >
      {({ chart }) => (
        <Line chart={chart} height="40px" hasHeader={false} hasFooter={false} hasFilters={false} />
      )}
    </HeadlessChart>
  )
})

export default Sparkline
