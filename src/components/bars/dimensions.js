import React, { useMemo, memo } from "react"
import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import { useChart, useAttributeValue, usePayload } from "@/components/provider"
import { TextMicro, TextNano } from "@netdata/netdata-ui/lib/components/typography"
import Units from "@/components/line/dimensions/units"
import UpdateEvery from "./updateEvery"
import Timestamp from "./timestamp"
import Dimension from "./dimension"

const Grid = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: 3fr 1fr 1fr 1fr;
  align-items: center;
`

const emptyArray = [null, null]

const getMaxDimensions = height => {
  const maxDimensions = Math.floor((height - 120) / 15) || 16
  return maxDimensions < 4 ? 4 : maxDimensions
}
const getHalf = height => getMaxDimensions(height) / 2

const getFrom = (total, index, height) => {
  if (total < getMaxDimensions(height)) return 0

  if (index < getHalf(height)) return 0

  if (index > total - getHalf(height)) return index - (getHalf(height) + (total - index))

  return index - getHalf(height)
}

const getTo = (total, index, height) => {
  if (total < getMaxDimensions(height)) return total

  if (index < getHalf(height)) return index + getHalf(height) + (getHalf(height) - index)

  if (index > total - getHalf(height)) return total

  return index + getHalf(height)
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

const Dimensions = ({ size, height }) => {
  const chart = useChart()
  const [x, row] = useAttributeValue("hoverX") || emptyArray
  const { data } = usePayload()

  const [from, to, total, ids, timestamp] = useMemo(() => {
    const index = chart.getClosestRow(x) || data.length - 1

    let dimensionIds =
      chart.onHoverSortDimensions(index, rowSorting[row] || rowSorting.default) || []

    if (chart.getAttribute("selectedDimensions").length > 0) {
      dimensionIds = dimensionIds.filter(id => chart.isDimensionVisible(id))
    }

    const rowIndex = dimensionIds.findIndex(id => id === row)

    const total = dimensionIds.length

    const from = Math.floor(getFrom(total, rowIndex, height))
    const to = Math.ceil(getTo(total, rowIndex, height))
    const ids = dimensionIds.slice(from, to)

    return [from, to, total, ids, data[index]?.[0]]
  }, [chart, row, x, data, height])

  const rowFlavour = rowFlavours[row] || rowFlavours.default

  return (
    <>
      {timestamp && <Timestamp value={timestamp} />}
      <UpdateEvery />

      <TextNano fontSize="0.8em" color="textLite">
        {from > 0 ? `↑${from} more values` : <>&nbsp;</>}
      </TextNano>

      <Grid gap={0.5} column>
        <TextMicro fontSize="0.8em" strong>
          Dimension
        </TextMicro>
        <TextMicro
          fontSize="0.8em"
          color={rowFlavour === rowFlavours.default ? "text" : "textLite"}
          textAlign="right"
        >
          Value{" "}
          <Units
            visible
            strong={rowFlavour === rowFlavours.default}
            color={rowFlavour === rowFlavours.default ? "text" : "textLite"}
            fontSize="0.8em"
          />
        </TextMicro>
        <TextMicro
          fontSize="0.8em"
          strong={rowFlavour === rowFlavours.ANOMALY_RATE}
          color={rowFlavour === rowFlavours.ANOMALY_RATE ? "text" : "textLite"}
          textAlign="right"
        >
          AR %
        </TextMicro>
        <TextMicro
          fontSize="0.8em"
          strong={rowFlavour === rowFlavours.ANNOTATIONS}
          color={rowFlavour === rowFlavours.ANNOTATIONS ? "text" : "textLite"}
          textAlign="right"
        >
          Info
        </TextMicro>

        {ids.map(id => (
          <Dimension
            key={id}
            id={id}
            strong={row === id}
            chars={size < 600 ? 200 : size / 3}
            rowFlavour={rowFlavour}
            size={(height - 90) / ids.length || 10}
          />
        ))}
      </Grid>

      <TextNano color="textLite" fontSize="0.8em">
        {to < total ? `↓${total - to} more values` : <>&nbsp;</>}
      </TextNano>
    </>
  )
}

export default memo(Dimensions)
