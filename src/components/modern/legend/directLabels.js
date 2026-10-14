import React from "react"
import styled from "styled-components"
import { Box, Flex, getColor } from "@netdata/netdata-ui"
import { useChart, usePlotArea } from "@/components/provider"
import { Flags, Unit, Value, onToggle } from "./parts"
import { Numeral } from "@/components/modern/numerals"
import { focusDimension, useClearFocusOnUnmount } from "./mode"
import { useLegendRows } from "./useLegendRows"

export const directColumnWidth = 128
const labelHeight = 16

export const getYCoord = (ui, value) => {
  if (!ui || typeof value !== "number" || !isFinite(value)) return null

  const u = ui.getUPlot?.()
  if (u) {
    const y = u.valToPos(value, "y")
    return isFinite(y) ? ui.getPlotArea().top + y : null
  }

  const dygraph = ui.getDygraph?.()
  if (dygraph) {
    const y = dygraph.toDomYCoord(value)
    return isFinite(y) ? y : null
  }

  return null
}

export const canPlaceDirect = ui => !!(ui && (ui.getUPlot || ui.getDygraph))

export const layoutLabels = (labels, height) => {
  const sorted = [...labels].sort((a, b) => a.y - b.y)

  sorted.forEach((label, index) => {
    const previous = sorted[index - 1]
    label.top = Math.max(0, label.y - labelHeight / 2)
    if (previous && label.top < previous.top + labelHeight) label.top = previous.top + labelHeight
  })

  const overflow =
    height > 0 && sorted.length ? sorted[sorted.length - 1].top + labelHeight - height : 0
  if (overflow > 0) {
    for (let i = sorted.length - 1; i >= 0; i--) {
      const next = sorted[i + 1]
      const limit = next ? next.top - labelHeight : height - labelHeight
      sorted[i].top = Math.max(0, Math.min(sorted[i].top, limit))
    }
  }

  return sorted
}

const Column = styled(Box).attrs({
  "data-testid": "modernLegend-direct",
  position: "relative",
  height: { min: "0px" },
  overflow: "hidden",
})`
  flex: 0 0 ${directColumnWidth}px;
`

const Label = styled(Flex).attrs(({ isOff }) => ({
  as: "button",
  type: "button",
  "data-testid": "modernLegend-label",
  position: "absolute",
  left: 0,
  right: 0,
  alignItems: "center",
  gap: 1.5,
  height: labelHeight / 4,
  padding: [0, 0, 0, 2],
  cursor: "pointer",
  opacity: isOff ? 0.4 : 1,
}))`
  border: 0;
  background: transparent;
  font-size: 12px;
`

const Name = styled(Box).attrs({ as: "span", width: { min: "0px" }, overflow: "hidden" })`
  color: ${({ labelColor }) => labelColor || "inherit"};
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Anomaly = styled(Numeral)`
  color: ${getColor("anomalyText")};
  font-size: 11px;
`

const lastValue = (chart, id) => {
  const { all } = chart.getPayload()

  for (let i = all.length - 1; i >= 0; i--) {
    const value = chart.getDimensionValue(id, i, { abs: false, allowNull: true })
    if (typeof value === "number" && isFinite(value)) return value
  }

  return null
}

const DirectLabels = ({ uiName = "default" }) => {
  const chart = useChart()
  usePlotArea(uiName)
  const { ids, getRow } = useLegendRows({ withRows: false })
  useClearFocusOnUnmount()
  const ui = chart.getUI(uiName)
  const area = ui?.getPlotArea?.()
  const columnHeight = area ? area.top + area.height : 0
  const visibleIds = ids.filter(id => chart.isDimensionVisible(id))
  const hiddenIds = ids.filter(id => !chart.isDimensionVisible(id))
  const hiddenSlots = Math.max(0, Math.floor(columnHeight / labelHeight) - visibleIds.length)
  const hidden = hiddenIds.slice(0, hiddenSlots).map(getRow)
  const height = area ? columnHeight - hidden.length * labelHeight : 0

  const placed = layoutLabels(
    visibleIds
      .map(getRow)
      .map(row => ({ ...row, y: getYCoord(ui, lastValue(chart, row.id)) }))
      .filter(row => row.y !== null),
    height
  )

  const renderLabel = (row, style) => (
    <Label
      key={row.id}
      style={style}
      isOff={!row.visible}
      onClick={onToggle(chart, row.id)}
      onMouseEnter={() => row.visible && focusDimension(chart, row.id)}
      onMouseLeave={() => focusDimension(chart, null)}
      data-track={chart.track(`dimension-${row.name}`)}
      data-dimension={row.id}
      title={row.name}
    >
      <Name labelColor={row.color}>{row.name}</Name>
      {row.visible && <Value>{row.display}</Value>}
      {row.visible && !!row.unit && <Unit data-testid="modernLegend-directUnit">{row.unit}</Unit>}
      {row.visible && !!row.anomaly && <Anomaly>{row.anomaly}</Anomaly>}
      {row.visible && <Flags flags={row.flags} />}
    </Label>
  )

  return (
    <Column data-track={chart.track("legend")}>
      {placed.map(row => renderLabel(row, { top: `${row.top}px` }))}
      {!!hidden.length && (
        <Box position="absolute" left={0} right={0} bottom={0}>
          {hidden.map(row => renderLabel(row, { position: "relative" }))}
        </Box>
      )}
    </Column>
  )
}

export default DirectLabels
