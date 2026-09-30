import React from "react"
import styled from "styled-components"
import { getColor } from "@netdata/netdata-ui"
import { useChart, usePlotArea } from "@/components/provider"
import { Flags, Numeral, onToggle } from "./parts"
import { focusDimension, useClearFocusOnUnmount } from "./mode"
import { useLegendRows } from "./useLegendRows"

export const directColumnWidth = 128
const labelHeight = 16

// the plot and this column share their top edge, so the renderer's y pixel is usable as is
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

// push overlapping labels down, then pull the stack back up if it runs past the bottom
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

const Column = styled.div.attrs({ "data-testid": "modernLegend-direct" })`
  position: relative;
  flex: 0 0 ${directColumnWidth}px;
  min-height: 0;
  overflow: hidden;
`

const Label = styled.button.attrs({ type: "button", "data-testid": "modernLegend-label" })`
  position: absolute;
  left: 0;
  right: 0;
  height: ${labelHeight}px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 0 0 8px;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  opacity: ${({ $off }) => ($off ? 0.4 : 1)};
`

const Name = styled.span`
  color: ${({ $color }) => $color || "inherit"};
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Value = styled(Numeral)`
  color: ${getColor("text")};
  font-weight: 600;
`

const Anomaly = styled(Numeral)`
  color: ${getColor("anomalyText")};
  font-size: 11px;
`

const HiddenList = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
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
  const { rows } = useLegendRows()
  useClearFocusOnUnmount()
  const ui = chart.getUI(uiName)
  const area = ui?.getPlotArea?.()
  const hidden = rows.filter(row => !row.visible)
  const height = area ? area.top + area.height - hidden.length * labelHeight : 0

  const placed = layoutLabels(
    rows
      .filter(row => row.visible)
      .map(row => ({ ...row, y: getYCoord(ui, lastValue(chart, row.id)) }))
      .filter(row => row.y !== null),
    height
  )

  const renderLabel = (row, style) => (
    <Label
      key={row.id}
      style={style}
      $off={!row.visible}
      onClick={onToggle(chart, row.id)}
      onMouseEnter={() => row.visible && focusDimension(chart, row.id)}
      onMouseLeave={() => focusDimension(chart, null)}
      data-track={chart.track(`dimension-${row.name}`)}
      data-dimension={row.id}
      title={row.name}
    >
      <Name $color={row.color}>{row.name}</Name>
      {row.visible && <Value>{row.display}</Value>}
      {row.visible && !!row.anomaly && <Anomaly>{row.anomaly}</Anomaly>}
      {row.visible && <Flags flags={row.flags} />}
    </Label>
  )

  return (
    <Column data-track={chart.track("legend")}>
      {placed.map(row => renderLabel(row, { top: `${row.top}px` }))}
      {!!hidden.length && (
        <HiddenList>{hidden.map(row => renderLabel(row, { position: "relative" }))}</HiddenList>
      )}
    </Column>
  )
}

export default DirectLabels
