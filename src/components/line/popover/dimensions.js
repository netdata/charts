import React, { useMemo, memo } from "react"
import styled from "styled-components"
import { Flex, TextMicro, TextNano } from "@netdata/netdata-ui"
import { useChart, useAttributeValue } from "@/components/provider"
import Units from "@/components/line/dimensions/units"
import UpdateEvery from "./updateEvery"
import Timestamp from "./timestamp"
import Dimension from "./dimension"
import useKeyboardListener from "./useKeyboardListener"

const Container = styled(Flex).attrs({
  round: true,
  width: { min: "196px", max: "80vw" },
  background: "dropdown",
  column: true,
  padding: [4],
  gap: 1,
})`
  box-shadow:
    0px 8px 12px rgba(9, 30, 66, 0.15),
    0px 0px 1px rgba(9, 30, 66, 0.31);
`

const Grid = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: 30px minmax(150px, max-content) 60px 60px minmax(80px, auto);
  align-items: center;
  justify-content: center;
`

const GridHeader = styled.div`
  display: contents;
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

  const rowFlavour = rowFlavours[row] || rowFlavours.default

  useKeyboardListener({ chart, ids })

  return (
    <Container data-testid="chartPopover-dimensions" gap={2}>
      <Flex column gap={1}>
        {x && <Timestamp value={x} />}
        <UpdateEvery />
      </Flex>
      <Flex flex={false} height={3}>
        {from > 0 && <TextNano color="textLite">↑{from} more values</TextNano>}
      </Flex>
      <Grid gap={1} column>
        <GridHeader>
          <TextMicro strong>Key</TextMicro>
          <TextMicro strong>Dimension</TextMicro>
          <TextMicro
            color={rowFlavour === rowFlavours.default ? "text" : "textLite"}
            textAlign="right"
          >
            Value
            {chart.getAttribute("chartType") !== "heatmap" && (
              <>
                {" "}
                <Units
                  visible
                  strong={rowFlavour === rowFlavours.default}
                  color={rowFlavour === rowFlavours.default ? "text" : "textLite"}
                />
              </>
            )}
          </TextMicro>
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
        {ids.map((id, index) => (
          <Dimension key={id} id={id} index={index} strong={row === id} rowFlavour={rowFlavour} />
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
