import React, { useMemo, memo } from "react"
import styled from "styled-components"
import { Flex, TextMicro, TextNano } from "@netdata/netdata-ui"
import { useChart, useAttributeValue } from "@/components/provider"
import UpdateEvery from "./updateEvery"
import Timestamp from "./timestamp"
import Dimension from "./dimension"
import {
  getPopoverDimensionColumnWidth,
  getPopoverWidth,
  popoverGridColumns,
} from "./layout"

const Container = styled(Flex).attrs({
  round: true,
  background: "dropdown",
  column: true,
  padding: [4],
  gap: 1,
})`
  box-sizing: border-box;
  width: ${({ $popoverWidth }) => $popoverWidth}px;
  box-shadow:
    0px 8px 12px rgba(9, 30, 66, 0.15),
    0px 0px 1px rgba(9, 30, 66, 0.31);
`

const Grid = styled.div`
  display: grid;
  width: 100%;
  max-width: 100%;
  grid-template-columns: ${({ $dimensionColumnWidth, $infoColumn }) =>
    `${$dimensionColumnWidth}px ${popoverGridColumns.value} ${popoverGridColumns.unit} ${popoverGridColumns.anomaly} ${$infoColumn}`};
  align-items: center;
`

const GridHeader = styled.div`
  display: contents;
`

const UnitHeader = styled(TextMicro)`
  box-sizing: border-box;
  padding-left: 6px;
`

const emptyArray = [null, null]

const getMaxDimensions = () => {
  const maxDimensions = Math.floor((window.innerHeight - 500) / 15) || 16
  return maxDimensions < 5 ? 5 : maxDimensions > 10 ? 10 : 10
}
const getHalf = () => getMaxDimensions() / 2

const getFrom = (total, index) => {
  if (total < getMaxDimensions()) return 0

  if (index < getHalf()) return 0

  if (index > total - getHalf()) return index - (getHalf() + (total - index))

  return index - getHalf()
}

const getTo = (total, index) => {
  if (total < getMaxDimensions()) return total

  if (index < getHalf()) return index + getHalf() + (getHalf() - index)

  if (index > total - getHalf()) return total

  return index + getHalf()
}

export const rowFlavours = {
  ANOMALY_RATE: "ANOMALY_RATE",
  ANNOTATIONS: "ANNOTATIONS",
  default: "VALUE",
}

const rowSorting = {
  ANOMALY_RATE: "anomalyDesc",
  ANNOTATIONS: "annotationsDesc",
  default: "valueDesc",
}

const Dimensions = () => {
  const chart = useChart()
  const [x, row] = useAttributeValue("hoverX") || emptyArray
  const isHeatmap = chart.getAttribute("chartType") === "heatmap"

  const [from, to, total, ids] = useMemo(() => {
    const index = chart.getClosestRow(x)

    let dimensionIds =
      chart.onHoverSortDimensions(index, rowSorting[row] || rowSorting.default) || []

    if (chart.getAttribute("selectedDimensions").length > 0) {
      dimensionIds = dimensionIds.filter(id => chart.isDimensionVisible(id))
    }

    const rowIndex = dimensionIds.findIndex(id => id === row)

    const total = dimensionIds.length
    if (isHeatmap) return [0, total, total, dimensionIds]

    const from = Math.floor(getFrom(total, rowIndex))
    const to = Math.ceil(getTo(total, rowIndex))
    const ids = dimensionIds.slice(from, to)

    return [from, to, total, ids]
  }, [chart, isHeatmap, row, x])

  const rowFlavour = rowFlavours[row] || rowFlavours.default
  const infoColumn =
    rowFlavour === rowFlavours.ANNOTATIONS
      ? popoverGridColumns.annotationsInfo
      : popoverGridColumns.info
  const dimensionNames = useMemo(() => ids.map(id => chart.getDimensionName(id) || ""), [
    chart,
    ids,
  ])
  const dimensionColumnWidth = useMemo(
    () => getPopoverDimensionColumnWidth(dimensionNames, { infoColumn }),
    [dimensionNames, infoColumn]
  )
  const popoverWidth = getPopoverWidth(dimensionColumnWidth, infoColumn)

  return (
    <Container data-testid="chartPopover-dimensions" gap={2} $popoverWidth={popoverWidth}>
      <Flex column gap={1}>
        {x && <Timestamp value={x} />}
        <UpdateEvery />
      </Flex>
      <Flex flex={false} height={3}>
        {from > 0 && <TextNano color="textLite">↑{from} more values</TextNano>}
      </Flex>
      <Grid
        data-testid="chartPopover-grid"
        $dimensionColumnWidth={dimensionColumnWidth}
        $infoColumn={infoColumn}
      >
        <GridHeader>
          <TextMicro strong>Dimension</TextMicro>
          <TextMicro
            color={rowFlavour === rowFlavours.default ? "text" : "textLite"}
            textAlign="right"
          >
            Value
          </TextMicro>
          <UnitHeader color="textLite">{!isHeatmap && "Unit"}</UnitHeader>
          <TextMicro
            strong={rowFlavour === rowFlavours.ANOMALY_RATE}
            color={rowFlavour === rowFlavours.ANOMALY_RATE ? "text" : "textLite"}
            textAlign="right"
          >
            Anomaly%
          </TextMicro>
          <TextMicro
            strong={rowFlavour === rowFlavours.ANNOTATIONS}
            color={rowFlavour === rowFlavours.ANNOTATIONS ? "text" : "textLite"}
            textAlign="right"
          >
            Info
          </TextMicro>
        </GridHeader>
        {ids.map(id => (
          <Dimension key={id} id={id} strong={row === id} rowFlavour={rowFlavour} />
        ))}
      </Grid>
      <Flex flex={false} height={3}>
        {to < total && (
          <TextNano color="textLite" margin={[2, 0, 0]}>
            ↓{total - to} more values
          </TextNano>
        )}
      </Flex>
    </Container>
  )
}

export default memo(Dimensions)
