import React, { useMemo, memo } from "react"
import styled from "styled-components"
import { Flex, TextMicro, TextNano } from "@netdata/netdata-ui"
import { useChart, useAttributeValue, useColor } from "@/components/provider"
import getWindowRange from "@/helpers/getWindowRange"
import Header from "./header"
import Dimension from "./dimension"
import { getPopoverDimensionColumnWidth, getPopoverWidth, popoverGridColumns } from "./layout"
import getTooltipDimensionIds from "@/helpers/getTooltipDimensionIds"

const Container = styled(Flex).attrs({
  round: true,
  background: "popoverBackground",
  column: true,
  padding: [4],
  gap: 1,
})`
  box-sizing: border-box;
  width: ${({ $popoverWidth }) => $popoverWidth}px;
  box-shadow:
    0px 8px 12px ${({ shadowColor }) => shadowColor},
    0px 0px 1px ${({ shadowColor }) => shadowColor};
`

const Grid = styled.div`
  display: grid;
  width: 100%;
  max-width: 100%;
  grid-template-columns: ${({ $dimensionColumnWidth, $infoColumn, $valueOnly }) =>
    $valueOnly
      ? `${$dimensionColumnWidth}px ${popoverGridColumns.value} ${popoverGridColumns.unit}`
      : `${$dimensionColumnWidth}px ${popoverGridColumns.value} ${popoverGridColumns.unit} ${popoverGridColumns.anomaly} ${$infoColumn}`};
  align-items: center;
`

const GridHeader = styled.div`
  display: contents;
`

const emptyArray = [null, null]

const getMaxDimensions = () => {
  const maxDimensions = Math.floor((window.innerHeight - 500) / 15) || 16
  return maxDimensions < 5 ? 5 : maxDimensions > 10 ? 10 : 10
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
  const shadow = useColor("themeShadow")
  const chart = useChart()
  const [x, row] = useAttributeValue("hoverX") || emptyArray
  const isHeatmap = chart.getAttribute("chartType") === "heatmap"
  const hoverColor = useAttributeValue("heatmapHoverColor")
  const heatmapValueOnly = useAttributeValue("heatmapTooltipValueOnly")
  const valueOnly = isHeatmap && !!heatmapValueOnly

  const [from, to, total, ids] = useMemo(() => {
    const index = chart.getClosestRow(x)

    const dimensionIds = getTooltipDimensionIds(chart, index, rowSorting[row] || rowSorting.default)

    const rowIndex = dimensionIds.findIndex(id => id === row)

    const total = dimensionIds.length
    if (isHeatmap) return [0, total, total, dimensionIds]

    const { from, to } = getWindowRange({
      total,
      index: rowIndex,
      limit: getMaxDimensions(),
    })
    const ids = dimensionIds.slice(from, to)

    return [from, to, total, ids]
  }, [chart, isHeatmap, row, x])

  const rowFlavour = rowFlavours[row] || rowFlavours.default
  const infoColumn =
    rowFlavour === rowFlavours.ANNOTATIONS
      ? popoverGridColumns.annotationsInfo
      : popoverGridColumns.info
  const dimensionNames = useMemo(
    () => ids.map(id => chart.getDimensionName(id) || ""),
    [chart, ids]
  )
  const dimensionColumnWidth = useMemo(
    () => getPopoverDimensionColumnWidth(dimensionNames, { infoColumn, valueOnly }),
    [dimensionNames, infoColumn, valueOnly]
  )
  const popoverWidth = getPopoverWidth(dimensionColumnWidth, infoColumn, { valueOnly })

  return (
    <Container
      data-testid="chartPopover-dimensions"
      gap={2}
      $popoverWidth={popoverWidth}
      shadowColor={shadow}
    >
      <Header timestamp={x} />
      <Flex flex={false} height={3}>
        {from > 0 && <TextNano color="textLite">↑{from} more values</TextNano>}
      </Flex>
      <Grid
        data-testid="chartPopover-grid"
        $dimensionColumnWidth={dimensionColumnWidth}
        $infoColumn={infoColumn}
        $valueOnly={valueOnly}
      >
        <GridHeader>
          <TextMicro strong>Dimension</TextMicro>
          <TextMicro
            color={rowFlavour === rowFlavours.default ? "text" : "textLite"}
            textAlign="right"
          >
            Value
          </TextMicro>
          <span aria-hidden="true" />
          {!valueOnly && (
            <>
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
            </>
          )}
        </GridHeader>
        {ids.map(id => (
          <Dimension
            key={id}
            id={id}
            strong={row === id}
            hoverColor={isHeatmap ? hoverColor : undefined}
            valueOnly={valueOnly}
            rowFlavour={rowFlavour}
          />
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
