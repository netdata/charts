import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue, useChart, usePayload } from "@/components/provider"
import HeatmapColors from "@/components/line/legend/heatmapColors"
import Expander from "@/components/line/footer/expander"
import Drawer from "@/components/drawer"
import Separator from "@/components/drawer/separator"
import { useIsHeatmap } from "@/helpers/heatmap"
import { useLegendMode } from "./mode"
import LegendLine from "./legendLine"
import { getReadoutIndex } from "./useLegendRows"
import { Highlight, Timestamp } from "./readouts"

const Time = () => {
  const chart = useChart()
  useAttributeValue("hoverX")
  useAttributeValue("clickX")
  usePayload()
  const { index, hovering, pinned } = getReadoutIndex(chart)
  const timestamp = index === -1 ? null : chart.getPayload().all[index]?.[0]
  const label = hovering ? "Hovering" : pinned ? "Pinned" : "Latest"

  return <Timestamp label={label} timestamp={timestamp} />
}

const Footer = () => {
  const showingInfo = useAttributeValue("showingInfo")
  const expandable = useAttributeValue("expandable")
  const expanded = useAttributeValue("expanded")
  const legend = useAttributeValue("legend")
  const mode = useLegendMode()
  const isHeatmap = useIsHeatmap()

  const readout = !showingInfo && legend
  const below = readout && mode === "below"

  return (
    <Flex column gap={1} padding={[1, 2, 1]} data-testid="chartFooter" data-legend={mode}>
      {readout && isHeatmap && <HeatmapColors />}
      {below && <LegendLine />}
      <Flex alignItems="center" justifyContent="between" gap={2} data-testid="modernFooter-actions">
        <Flex alignItems="center" gap={2} flex overflow="hidden">
          <Highlight />
          {mode !== "hidden" && <Time />}
        </Flex>
        <Flex alignItems="center" gap={2} flex={false} padding={[0, 4, 0, 0]}>
          {expandable && <Expander />}
        </Flex>
      </Flex>
      {expandable && expanded && (
        <>
          <Separator />
          <Drawer />
        </>
      )}
    </Flex>
  )
}

export default Footer
