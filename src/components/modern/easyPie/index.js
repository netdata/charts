import React from "react"
import styled from "styled-components"
import { Flex, getColor } from "@netdata/netdata-ui"
import {
  useAttributeValue,
  useChart,
  useLatestDisplayValueWithUnit,
  useOnResize,
  useVisibleDimensionIds,
} from "@/components/provider"
import { getRingValue } from "@/chartLibraries/easyPie/ringValue"
import { numeralsFont } from "@/components/modern/tokens"
import { formatReadout } from "@/components/modern/format"
import { useAttention } from "@/components/modern/number/attention"

const radius = 34
const stroke = 5
const circumference = 2 * Math.PI * radius

const resolve = color => props => getColor(color)(props)

const Track = styled.circle`
  fill: none;
  stroke: ${resolve("borderSecondary")};
`

const Arc = styled.circle`
  fill: none;
  stroke: ${({ $color }) => resolve($color)};
  transition: stroke-dasharray 150ms linear;
`

const Label = styled.text`
  font-family: ${numeralsFont};
  font-variant-numeric: tabular-nums;
  fill: ${({ $color }) => resolve($color)};
`

export const toFraction = percentage =>
  typeof percentage === "number" && isFinite(percentage)
    ? Math.min(Math.max(percentage, 0), 100) / 100
    : 0

const fitFontSize = (text, max, room) =>
  Math.min(max, room / Math.max(1, String(text).length * 0.56))

const ModernEasyPie = ({ uiName, size }) => {
  const chart = useChart()
  useOnResize(uiName)
  useAttributeValue("hoverX")

  const [dimensionId] = useVisibleDimensionIds()
  const { value, convertedUnit: unit, unitAttributes } = useLatestDisplayValueWithUnit(dimensionId)
  const convertedValue = formatReadout(chart, value, { dimensionId, unitAttributes })

  const ring = getRingValue(chart)
  const { color } = useAttention(ring?.value ?? null, ring?.min)
  const fraction = toFraction(ring?.percentage)

  const valueSize = fitFontSize(convertedValue, 20, 52)
  const unitSize = fitFontSize(unit || "", 10, 44)
  const label = unit ? `${convertedValue} ${unit}` : String(convertedValue)

  return (
    <Flex
      width={`${size}px`}
      height={`${size}px`}
      alignItems="center"
      justifyContent="center"
      data-testid="modernEasyPie"
    >
      <svg
        viewBox="0 0 80 80"
        width="100%"
        height="100%"
        role="img"
        aria-label={label}
        data-fraction={fraction}
      >
        <Track cx="40" cy="40" r={radius} strokeWidth={stroke} />
        {fraction > 0 && (
          <Arc
            cx="40"
            cy="40"
            r={radius}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference * fraction} ${circumference}`}
            transform="rotate(-90 40 40)"
            $color={color || "textLite"}
            data-testid="modernEasyPieArc"
          />
        )}
        <Label
          x="40"
          y={unit ? 42 : 46}
          textAnchor="middle"
          fontSize={valueSize}
          fontWeight="600"
          $color={color || "text"}
          data-testid="modernEasyPieValue"
        >
          {convertedValue}
        </Label>
        {!!unit && (
          <Label
            x="40"
            y="54"
            textAnchor="middle"
            fontSize={unitSize}
            $color="textLite"
            data-testid="modernEasyPieUnit"
          >
            {unit}
          </Label>
        )}
      </svg>
    </Flex>
  )
}

export default ModernEasyPie
