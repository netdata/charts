import React from "react"
import styled from "styled-components"
import { Box, getColor } from "@netdata/netdata-ui"
import {
  useAttributeValue,
  useChart,
  useColor,
  useFormatDate,
  useFormatTime,
} from "@/components/provider"
import { useIsHeatmap } from "@/helpers/heatmap"
import { radius, tabularNumbers } from "@/components/modern/tokens"
import { Flags, Unit, Value as BaseValue } from "./parts"
import { Numeral } from "@/components/modern/numerals"
import { LineSwatch } from "@/components/modern/swatch"
import { useLegendRows } from "./useLegendRows"

export const maxTooltipRows = 6

const sortByRow = { ANOMALY_RATE: "anomalyDesc", ANNOTATIONS: "annotationsDesc" }

const idOf = item => (typeof item === "object" && item !== null ? item.id : item)

export const pickShown = (rows, hoveredId, limit = maxTooltipRows) => {
  const shown = rows.slice(0, limit)
  const hovered = rows.findIndex(row => idOf(row) === hoveredId)
  if (hovered < limit) return shown

  return [...shown.slice(0, limit - 1), rows[hovered]]
}

const Container = styled(Box).attrs({
  "data-testid": "modernTooltip",
  width: { min: 45, max: 90 },
  background: "dropdown",
  round: radius.control,
})`
  padding: 8px 10px;
  box-shadow:
    0 6px 24px ${({ shadowColor }) => shadowColor},
    0 0 1px ${({ shadowColor }) => shadowColor};
  font-size: 12px;
  ${tabularNumbers}
`

const Time = styled(Box).attrs({ "data-testid": "modernTooltip-time", margin: [0, 0, 1.5] })`
  color: ${getColor("textLite")};
  white-space: nowrap;
`

const Grid = styled(Box)`
  display: grid;
  grid-template-columns: ${({ gridColumns }) => gridColumns};
  align-items: center;
  column-gap: 8px;
  row-gap: 2px;
`

const Name = styled(Box).attrs({ as: "span", width: { min: "0px" }, overflow: "hidden" })`
  color: ${getColor("text")};
  font-weight: ${({ isStrong }) => (isStrong ? 600 : 400)};
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Value = styled(BaseValue)`
  text-align: right;
`

const Anomaly = styled(Numeral)`
  color: ${getColor("anomalyText")};
  text-align: right;
`

const Muted = styled(Box).attrs({ margin: [1, 0, 0, 0] })`
  color: ${getColor("textLite")};
  white-space: nowrap;
`

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

  return <Muted data-testid="modernTooltip-granularity">{text}</Muted>
}

const Tooltip = () => {
  const shadow = useColor("themeShadow")
  const chart = useChart()
  const isHeatmap = useIsHeatmap()
  const [, hoveredId] = useAttributeValue("hoverX") || []
  const { index, timestamp, getRow } = useLegendRows({ withRows: false })

  if (index === -1) return null

  let ids = chart.onHoverSortDimensions(index, sortByRow[hoveredId] || "valueDesc") || []
  if (chart.getAttribute("selectedDimensions").length > 0)
    ids = ids.filter(id => chart.isDimensionVisible(id))
  const shown = (isHeatmap ? ids : pickShown(ids, hoveredId)).map(getRow)
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
    <Container shadowColor={shadow}>
      {!!timestamp && <Timestamp value={timestamp} />}
      <Grid gridColumns={columns}>
        {shown.map(row => (
          <React.Fragment key={row.id}>
            {!isHeatmap && <LineSwatch swatchColor={row.color} />}
            <Name isStrong={row.id === hoveredId} data-testid="modernTooltip-name">
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
