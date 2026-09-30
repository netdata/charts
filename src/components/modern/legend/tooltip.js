import React from "react"
import styled from "styled-components"
import { getColor } from "@netdata/netdata-ui"
import { useAttributeValue, useChart, useFormatDate, useFormatTime } from "@/components/provider"
import { useIsHeatmap } from "@/helpers/heatmap"
import { radius, tabularNumbers } from "@/components/modern/tokens"
import { Flags, Numeral, Swatch } from "./parts"
import { useLegendRows } from "./useLegendRows"

export const maxTooltipRows = 6

// hovering the anomaly or annotation strip ranks rows by that strip, like the classic popover
const sortByRow = { ANOMALY_RATE: "anomalyDesc", ANNOTATIONS: "annotationsDesc" }

const idOf = item => (typeof item === "object" && item !== null ? item.id : item)

// keep the hovered series in view even when it ranks below the cut; takes rows or bare ids
export const pickShown = (rows, hoveredId, limit = maxTooltipRows) => {
  const shown = rows.slice(0, limit)
  const hovered = rows.findIndex(row => idOf(row) === hoveredId)
  if (hovered < limit) return shown

  return [...shown.slice(0, limit - 1), rows[hovered]]
}

const Container = styled.div.attrs({ "data-testid": "modernTooltip" })`
  box-sizing: border-box;
  min-width: 180px;
  max-width: 360px;
  padding: 8px 10px;
  border-radius: ${radius.control};
  background: ${getColor("dropdown")};
  box-shadow:
    0 6px 24px rgba(9, 30, 66, 0.16),
    0 0 1px rgba(9, 30, 66, 0.31);
  font-size: 12px;
  ${tabularNumbers}
`

const Time = styled.div.attrs({ "data-testid": "modernTooltip-time" })`
  color: ${getColor("textLite")};
  margin-bottom: 6px;
  white-space: nowrap;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: ${({ $columns }) => $columns};
  align-items: center;
  column-gap: 8px;
  row-gap: 2px;
`

const Name = styled.span`
  color: ${getColor("text")};
  font-weight: ${({ $strong }) => ($strong ? 600 : 400)};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Value = styled(Numeral)`
  color: ${getColor("text")};
  font-weight: 600;
  text-align: right;
`

const Unit = styled.span`
  color: ${getColor("textDescription")};
  font-size: 11px;
  white-space: nowrap;
`

const Anomaly = styled(Numeral)`
  color: ${getColor("anomalyText")};
  text-align: right;
`

const Muted = styled.div`
  color: ${getColor("textLite")};
  margin-top: 4px;
  white-space: nowrap;
`

const Granularity = styled(Muted).attrs({ "data-testid": "modernTooltip-granularity" })``

const Timestamp = ({ value }) => {
  const date = useFormatDate(value)
  const time = useFormatTime(value)

  return <Time>{`${date} • ${time}`}</Time>
}

const GranularityLine = () => {
  const updateEvery = useAttributeValue("updateEvery")
  const viewUpdateEvery = useAttributeValue("viewUpdateEvery")
  const groupingMethod = useAttributeValue("groupingMethod")

  const text =
    viewUpdateEvery && viewUpdateEvery !== updateEvery
      ? `Granularity ${updateEvery}s, ${groupingMethod} per ${viewUpdateEvery}s`
      : `Granularity ${updateEvery}s`

  return <Granularity>{text}</Granularity>
}

const Tooltip = () => {
  const chart = useChart()
  const isHeatmap = useIsHeatmap()
  const [, hoveredId] = useAttributeValue("hoverX") || []
  const { index, timestamp, getRow } = useLegendRows({ withRows: false })

  if (index === -1) return null

  // the sort runs on raw values; only the rows that fit are formatted
  const ids = chart.onHoverSortDimensions(index, sortByRow[hoveredId] || "valueDesc") || []
  const shown = pickShown(ids, hoveredId).map(getRow)
  const more = ids.length - shown.length
  const withAnomaly = shown.some(row => !!row.anomaly)
  const withFlags = shown.some(row => !!row.flags)

  const columns = [
    isHeatmap ? null : "10px",
    "minmax(0, 1fr)",
    "auto",
    "auto",
    withAnomaly ? "auto" : null,
    withFlags ? "auto" : null,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <Container>
      {!!timestamp && <Timestamp value={timestamp} />}
      <Grid $columns={columns}>
        {shown.map(row => (
          <React.Fragment key={row.id}>
            {!isHeatmap && <Swatch $color={row.color} />}
            <Name $strong={row.id === hoveredId} data-testid="modernTooltip-name">
              {row.name}
            </Name>
            <Value>{row.display}</Value>
            <Unit>{row.unit}</Unit>
            {withAnomaly && <Anomaly>{row.anomaly}</Anomaly>}
            {withFlags && (row.flags ? <Flags flags={row.flags} /> : <span />)}
          </React.Fragment>
        ))}
      </Grid>
      {more > 0 && <Muted data-testid="modernTooltip-more">{`${more} more`}</Muted>}
      <GranularityLine />
    </Container>
  )
}

export default Tooltip
