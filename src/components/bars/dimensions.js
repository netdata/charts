import React, { useMemo, memo } from "react"
import styled from "styled-components"
import { useChart, useAttributeValue, usePayload } from "@/components/provider"
import { TextMicro, TextNano } from "@netdata/netdata-ui/lib/components/typography"
import Units from "@/components/line/dimensions/units"
import Dimension from "./dimension"

const Grid = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: ${({ cols }) => {
    switch (cols) {
      case "full":
        return "2fr 1fr 1fr 1fr"
      default:
        return "2fr 2fr"
    }
  }};
  align-items: center;
`

const emptyArray = [null, null]

const getMaxDimensions = height => {
  const maxDimensions = Math.round((height - 60) / 18)
  return maxDimensions < 2 ? 2 : maxDimensions
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

const Dimensions = ({ size, height, width }) => {
  const chart = useChart()
  const [x, row] = useAttributeValue("hoverX") || emptyArray
  const { data } = usePayload()

  const [from, to, total, ids] = useMemo(() => {
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

    return [from, to, total, ids]
  }, [chart, row, x, data, height])

  const rowFlavour = rowFlavours[row] || rowFlavours.default

  const cols = useAttributeValue("cols")

  return (
    <>
      <TextNano fontSize="1em" color="textLite">
        {from > 0 ? `↑${from} more values` : <>&nbsp;</>}
      </TextNano>

      <Grid gap={0.5} column cols={cols}>
        <TextMicro fontSize="1em" strong>
          Dimension
        </TextMicro>
        <TextMicro
          fontSize="1em"
          color={rowFlavour === rowFlavours.default ? "text" : "textLite"}
          textAlign="right"
        >
          Value{" "}
          <Units
            visible
            strong={rowFlavour === rowFlavours.default}
            color={rowFlavour === rowFlavours.default ? "text" : "textLite"}
            fontSize="1em"
          />
        </TextMicro>
        {cols === "full" && (
          <>
            <TextMicro
              fontSize="1em"
              strong={rowFlavour === rowFlavours.ANOMALY_RATE}
              color={rowFlavour === rowFlavours.ANOMALY_RATE ? "text" : "textLite"}
              textAlign="right"
            >
              AR %
            </TextMicro>
            <TextMicro
              fontSize="1em"
              strong={rowFlavour === rowFlavours.ANNOTATIONS}
              color={rowFlavour === rowFlavours.ANNOTATIONS ? "text" : "textLite"}
              textAlign="right"
            >
              Info
            </TextMicro>
          </>
        )}

        {ids.map(id => (
          <Dimension
            key={id}
            id={id}
            strong={row === id}
            chars={parseInt(width / (cols === "full" ? 3 : 2))}
            rowFlavour={rowFlavour}
            size={(size - 80) / ids.length}
            fullCols={cols === "full"}
          />
        ))}
      </Grid>

      <TextNano color="textLite" fontSize="1em">
        {to < total ? `↓${total - to} more values` : <>&nbsp;</>}
      </TextNano>
    </>
  )
}

export default memo(Dimensions)
