import React, { useMemo, memo } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useChart, useAttributeValue } from "@/components/provider"
import { TextMicro, TextNano } from "@netdata/netdata-ui/lib/components/typography"
import Units from "@/components/line/dimensions/units"
import UpdateEvery from "./updateEvery"
import Timestamp from "./timestamp"
import Dimension from "./dimension"

const Container = styled(Flex).attrs(props => ({
  round: true,
  border: { side: "all", color: "elementBackground" },
  width: { min: "196px", max: props.maxWidth ? `${props.maxWidth}px` : "80vw" },
  background: "dropdown",
  column: true,
  padding: [4],
  gap: 1,
}))`
  box-shadow: 0px 8px 12px rgba(9, 30, 66, 0.15), 0px 0px 1px rgba(9, 30, 66, 0.31);
`

const Grid = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: minmax(150px, 2fr) 60px 60px minmax(80px, 1fr);
  align-items: center;
`

const GridHeader = styled.div`
  display: contents;
`

const emptyArray = [null, null]

const maxDimensions = Math.floor((window.innerHeight - 500) / 15) || 16
const half = maxDimensions / 2

const getFrom = (total, index) => {
  if (total < maxDimensions) return 0

  if (index < half) return 0

  if (index > total - half) return index - (half + (total - index))

  return index - half
}

const getTo = (total, index) => {
  if (total < maxDimensions) return total

  if (index < half) return index + half + (half - index)

  if (index > total - half) return total

  return index + half
}

export const rowFlavours = {
  ANOMALY_RATE: "ANOMALY_RATE",
  ANNOTATIONS: "ANNOTATIONS",
  default: "VALUE",
}

const rowSorting = {
  ANOMALY_RATE: "anomalyDesc",
  default: "valueDesc",
}

const Dimensions = () => {
  const chart = useChart()
  const [x, row] = useAttributeValue("hoverX") || emptyArray

  const [from, to, total, ids] = useMemo(() => {
    const index = chart.getClosestRow(x)

    let dimensionIds =
      chart.onHoverSortDimensions(index, rowSorting[row] || rowSorting.default) || []

    if (chart.getAttribute("selectedDimensions").length > 0) {
      dimensionIds = dimensionIds.filter(id => chart.isDimensionVisible(id))
    }

    const rowIndex = dimensionIds.findIndex(id => id === row)

    const total = dimensionIds.length
    const from = Math.floor(getFrom(total, rowIndex))
    const to = Math.ceil(getTo(total, rowIndex))
    const ids = dimensionIds.slice(from, to)

    return [from, to, total, ids]
  }, [chart, row, x])

  const chartWidth = chart.getUI().getEstimatedChartWidth() * 0.9
  const rowFlavour = rowFlavours[row] || rowFlavours.default

  return (
    <Container data-testid="chartPopover-dimensions" maxWidth={chartWidth} gap={2}>
      <Flex column gap={1}>
        {x && <Timestamp value={x} />}
        <UpdateEvery />
      </Flex>
      {from > 0 && <TextNano color="textLite">↑{from} more values</TextNano>}
      <Grid gap={1} column>
        <GridHeader>
          <TextMicro strong>Dimension</TextMicro>
          <TextMicro
            color={rowFlavour === rowFlavours.default ? "text" : "textLite"}
            textAlign="right"
          >
            Value{" "}
            <Units
              visible
              strong={rowFlavour === rowFlavours.default}
              color={rowFlavour === rowFlavours.default ? "text" : "textLite"}
            />
          </TextMicro>
          <TextMicro
            strong={rowFlavour === rowFlavours.ANOMALY_RATE}
            color={rowFlavour === rowFlavours.ANOMALY_RATE ? "text" : "textLite"}
            textAlign="right"
          >
            AR %
          </TextMicro>
          <TextMicro
            strong={rowFlavour === rowFlavours.ANNOTATIONS}
            color={rowFlavour === rowFlavours.ANNOTATIONS ? "text" : "textLite"}
            textAlign="right"
          >
            Annotations
          </TextMicro>
        </GridHeader>
        {ids.map(id => (
          <Dimension
            key={id}
            id={id}
            strong={row === id}
            chars={chartWidth ? chartWidth / 3 : 200}
            rowFlavour={rowFlavour}
          />
        ))}
      </Grid>
      {to < total && (
        <TextNano color="textLite" margin={[2, 0, 0]}>
          ↓{total - to} more values
        </TextNano>
      )}
    </Container>
  )
}

export default memo(Dimensions)
