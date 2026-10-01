import React from "react"
import styled from "styled-components"
import { Flex, TextNano, getColor } from "@netdata/netdata-ui"
import {
  useAttributeValue,
  useChart,
  useFormatDate,
  useFormatTime,
  usePayload,
} from "@/components/provider"
import HeatmapColors from "@/components/line/legend/heatmapColors"
import DimensionSort from "@/components/line/dimensionSort"
import Expander from "@/components/line/footer/expander"
import Drawer from "@/components/drawer"
import Separator from "@/components/drawer/separator"
import { useIsHeatmap } from "@/helpers/heatmap"
import { radius, tabularNumbers } from "@/components/modern/tokens"
import { useLegendMode } from "./mode"
import LegendLine from "./legendLine"
import { getReadoutIndex } from "./useLegendRows"
import { formatCompactRange } from "./compactRange"

const HighlightChip = styled(Flex).attrs({
  "data-testid": "modernFooter-highlight",
  alignItems: "center",
  gap: 1,
  padding: [0.5, 2],
  cursor: "pointer",
})`
  min-width: 0;
  max-width: 100%;
  flex: 0 1 auto;
  overflow: hidden;
  white-space: nowrap;
  border-radius: ${radius.pill};
  border: 1px solid ${getColor("border")};

  &:hover {
    border-color: ${getColor("text")};
  }
`

const HighlightLabel = styled(TextNano).attrs({ color: "textLite" })`
  flex-shrink: 0;
  white-space: nowrap;
`

const HighlightRange = styled(TextNano).attrs({
  color: "textDescription",
  "data-testid": "modernFooter-highlightRange",
})`
  ${tabularNumbers}
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const TimeText = styled(TextNano).attrs({
  color: "textDescription",
  "data-testid": "modernFooter-time",
})`
  ${tabularNumbers}
  white-space: nowrap;
`

const Highlight = () => {
  const chart = useChart()
  const { highlight } = useAttributeValue("overlays")
  const range = highlight?.range
  const { after, before } = highlight?.moveX ?? {}
  useAttributeValue("timezone")
  useAttributeValue("locale")

  if (!range) return null

  const text = formatCompactRange(chart, range[0], range[1])

  return (
    <HighlightChip
      onClick={() => after && before && chart.moveX(after, before)}
      title={`Zoom to the highlighted range: ${text}`}
    >
      <HighlightLabel>Highlight</HighlightLabel>
      <HighlightRange>{text}</HighlightRange>
    </HighlightChip>
  )
}

const Time = () => {
  const chart = useChart()
  useAttributeValue("hoverX")
  usePayload()
  const { index, hovering } = getReadoutIndex(chart)
  const timestamp = index === -1 ? null : chart.getPayload().all[index]?.[0]
  const date = useFormatDate(timestamp || 0)
  const time = useFormatTime(timestamp || 0)

  if (!timestamp) return null

  return <TimeText>{`${hovering ? "Hovering" : "Latest"} ${date} • ${time}`}</TimeText>
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
        <Flex alignItems="center" gap={2} flex={false}>
          {readout && !isHeatmap && mode !== "hidden" && <DimensionSort padding={[0]} />}
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
