import React from "react"
import styled from "styled-components"
import { Flex, TextSmall, getColor } from "@netdata/netdata-ui"
import {
  useAttributeValue,
  useChart,
  useLatestDisplayValueWithUnit,
  useOnResize,
  useVisibleDimensionIds,
} from "@/components/provider"
import { numeralsFont } from "@/components/modern/tokens"
import { formatReadout } from "@/components/modern/format"
import { useTileAlert } from "./alertDot"

const clamp = (value, low, high) => Math.min(Math.max(value, low), high)

const Numerals = styled.span`
  font-family: ${numeralsFont};
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
  font-size: ${({ $size }) => $size}px;
  color: ${({ $tone, theme }) => getColor($tone)({ theme })};
`

const Value = styled(Numerals)`
  font-weight: 600;
  letter-spacing: -0.01em;
`

const fallbackWidth = 300
const fallbackHeight = 190

// sized from the tile's plot so the number never crowds the trend underneath it
export const getReadoutSizes = ({ width, height, chars, unitChars }) => {
  const usableWidth = (width || fallbackWidth) - 24
  const fit = usableWidth / (chars * 0.56 + unitChars * 0.22 + 0.3)
  const value = Math.floor(clamp(Math.min(fit, (height || fallbackHeight) * 0.3), 14, 34))
  return { value, unit: Math.max(11, Math.round(value * 0.4)) }
}

const TileReadout = ({ dimensionId: requestedId }) => {
  const chart = useChart()
  const { width, height } = useOnResize()
  const loaded = useAttributeValue("loaded")
  const visibleIds = useVisibleDimensionIds()
  const alert = useTileAlert()

  // matches the default overlay: an id that is not visible falls back to the first visible one
  const dimensionId = chart.isDimensionVisible(requestedId) ? requestedId : visibleIds[0]
  const { value, convertedUnit: unit, unitAttributes } = useLatestDisplayValueWithUnit(dimensionId)

  if (typeof value !== "number" || !isFinite(value))
    return (
      <Flex height={{ min: "22px" }} alignItems="center" data-testid="modernTileReadout-empty">
        <TextSmall color="textLite">{loaded ? "No data" : "Loading…"}</TextSmall>
      </Flex>
    )

  const text = formatReadout(chart, value, { dimensionId, unitAttributes })
  const sizes = getReadoutSizes({
    width,
    height,
    chars: String(text).length,
    unitChars: unit ? String(unit).length : 0,
  })

  return (
    <Flex
      alignItems="baseline"
      gap={1}
      overflow="hidden"
      flex={false}
      data-testid="modernTileReadout"
    >
      <Value
        $size={sizes.value}
        $tone={alert?.tone || "text"}
        data-testid="modernTileReadout-value"
      >
        {text}
      </Value>
      {!!unit && (
        <Numerals $size={sizes.unit} $tone="textLite" data-testid="modernTileReadout-unit">
          {unit}
        </Numerals>
      )}
    </Flex>
  )
}

export default TileReadout
