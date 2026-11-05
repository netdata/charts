import React, { useRef } from "react"
import styled from "styled-components"
import { Box, Flex, TextSmall, getColor } from "@netdata/netdata-ui"
import {
  useAttributeValue,
  useChart,
  useLatestDisplayValueWithUnit,
  useOnResize,
} from "@/components/provider"
import { numerals } from "@/components/modern/numerals"
import { formatReadout } from "@/components/modern/format"
import { useTileAlert } from "./alertDot"

const clamp = (value, low, high) => Math.min(Math.max(value, low), high)

const Numerals = styled(Box).attrs({ as: "span" })`
  ${numerals}
  line-height: 1;
  white-space: nowrap;
  font-size: ${({ numeralSize }) => numeralSize}px;
  color: ${({ tone, theme }) => getColor(tone)({ theme })};
`

const Value = styled(Numerals)`
  font-weight: 600;
  letter-spacing: -0.01em;
`

const fallbackWidth = 300
const fallbackHeight = 190

export const getReadoutSizes = ({ width, height, chars, unitChars }) => {
  const usableWidth = (width || fallbackWidth) - 24
  const fit = usableWidth / (chars * 0.56 + unitChars * 0.22 + 0.3)
  const value = Math.floor(clamp(Math.min(fit, (height || fallbackHeight) * 0.3), 14, 34))
  return { value, unit: Math.max(11, Math.round(value * 0.4)) }
}

export const useStableChars = (key, chars, unitChars) => {
  const widest = useRef({ key: null, chars: 0, unitChars: 0 })

  if (widest.current.key !== key) widest.current = { key, chars: 0, unitChars: 0 }
  widest.current.chars = Math.max(widest.current.chars, chars)
  widest.current.unitChars = Math.max(widest.current.unitChars, unitChars)

  return widest.current
}

const TileReadout = ({ dimensionId }) => {
  const chart = useChart()
  const { width, height } = useOnResize()
  const loaded = useAttributeValue("loaded")
  const alert = useTileAlert()

  const { value, convertedUnit: unit, unitAttributes } = useLatestDisplayValueWithUnit(dimensionId)
  const text =
    typeof value === "number" && isFinite(value)
      ? formatReadout(chart, value, { dimensionId, unitAttributes })
      : ""
  const widest = useStableChars(
    `${dimensionId}|${width}|${height}`,
    String(text).length,
    unit ? String(unit).length : 0
  )

  if (typeof value !== "number" || !isFinite(value))
    return (
      <Flex height={{ min: "22px" }} alignItems="center" data-testid="modernTileReadout-empty">
        <TextSmall color="textLite">{loaded ? "No data" : "Loading…"}</TextSmall>
      </Flex>
    )

  const sizes = getReadoutSizes({
    width,
    height,
    chars: widest.chars,
    unitChars: widest.unitChars,
  })

  return (
    <Flex
      alignItems="baseline"
      gap={1}
      overflow="hidden"
      flex={false}
      height={`${sizes.value}px`}
      data-testid="modernTileReadout"
    >
      <Value
        numeralSize={sizes.value}
        tone={alert?.tone || "text"}
        data-testid="modernTileReadout-value"
      >
        {text}
      </Value>
      {!!unit && (
        <Numerals numeralSize={sizes.unit} tone="textLite" data-testid="modernTileReadout-unit">
          {unit}
        </Numerals>
      )}
    </Flex>
  )
}

export default TileReadout
