import React, { useState } from "react"
import styled from "styled-components"
import { Flex, TextSmall, getColor } from "@netdata/netdata-ui"
import {
  useChart,
  useAttributeValue,
  useOnResize,
  usePayload,
  useUnitSign,
  useVisibleDimensionIds,
} from "@/components/provider"
import { numeralsFont, tabularNumbers } from "@/components/modern/tokens"
import { formatReadout } from "@/components/modern/format"
import getDonutData from "./getDonutData"

const size = 180
const center = size / 2
const ringRadius = 70
const ringWidth = 20
const gap = 0.025
const centerFontSize = 28
const centerFit = 7

const polar = angle => [
  center + ringRadius * Math.cos(angle),
  center + ringRadius * Math.sin(angle),
]

const arcPath = (a0, a1) => {
  const [x0, y0] = polar(a0)
  const [x1, y1] = polar(a1)
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M${x0},${y0} A${ringRadius},${ringRadius} 0 ${large} 1 ${x1},${y1}`
}

const toArcs = (slices, total) => {
  const sliceGap = slices.length > 1 ? gap : 0
  let angle = -Math.PI / 2

  return slices.map(slice => {
    const span = (slice.value / total) * Math.PI * 2
    const arc = { ...slice, a0: angle + sliceGap, a1: angle + span - sliceGap }
    angle += span
    return arc
  })
}

const Svg = styled.svg`
  height: 100%;
  max-height: 220px;
  max-width: 45%;
  aspect-ratio: 1;
  flex-shrink: 0;
  overflow: visible;
`

const Slice = styled.path`
  transition:
    opacity 120ms,
    stroke-width 120ms;
  cursor: pointer;
`

const CenterValue = styled.text`
  fill: ${getColor("text")};
  font-family: ${numeralsFont};
  font-weight: 600;
  ${tabularNumbers}
`

const CenterCaption = styled.text`
  fill: ${getColor("textLite")};
  font-size: 11px;
`

const Numeral = styled(TextSmall)`
  font-family: ${numeralsFont};
  ${tabularNumbers}
`

const LegendRow = styled.div`
  display: grid;
  grid-template-columns: 10px minmax(24px, 1fr) auto 32px;
  gap: 8px;
  align-items: center;
  opacity: ${({ $dimmed }) => ($dimmed ? 0.4 : 1)};
  transition: opacity 120ms;
  cursor: pointer;
`

const Swatch = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: ${({ $color }) => $color};
`

const sliceDimensionId = slice => (slice.grouped ? undefined : slice.id)

const formatSlice = (chart, slice, options) =>
  formatReadout(chart, slice.signedValue ?? slice.value, {
    dimensionId: sliceDimensionId(slice),
    ...options,
  })

export const getCenterFontSize = text =>
  text.length > centerFit
    ? Math.max(14, Math.floor((centerFontSize * centerFit) / text.length))
    : centerFontSize

const formatShare = share => `${share < 1 && share > 0 ? "<1" : Math.round(share)}%`

const Legend = ({ chart, slices, focus, setFocus }) => (
  <Flex
    column
    gap={1.5}
    flex
    width={{ min: "0px" }}
    overflow={{ vertical: "auto" }}
    data-testid="donut-legend"
  >
    {slices.map(slice => {
      const value = formatSlice(chart, slice)

      return (
        <LegendRow
          key={slice.id}
          $dimmed={!!focus && focus !== slice.id}
          onMouseEnter={() => setFocus(slice.id)}
          onMouseLeave={() => setFocus(null)}
          data-testid="donut-legend-row"
          title={slice.grouped ? slice.grouped.join(", ") : slice.name}
        >
          <Swatch $color={slice.color} />
          <TextSmall color="text" truncate data-testid="donut-legend-name">
            {slice.name}
          </TextSmall>
          <Numeral
            color="text"
            strong
            whiteSpace="nowrap"
            textAlign="right"
            data-testid="donut-legend-value"
          >
            {value}
          </Numeral>
          <Numeral color="textLite" whiteSpace="nowrap" textAlign="right">
            {formatShare(slice.share)}
          </Numeral>
        </LegendRow>
      )
    })}
  </Flex>
)

const ModernDonut = ({ uiName }) => {
  const chart = useChart()
  const { width } = useOnResize(uiName)

  useAttributeValue("hoverX")
  useAttributeValue("theme")
  useVisibleDimensionIds()
  usePayload()
  const unit = useUnitSign()

  const [focus, setFocus] = useState(null)
  const { slices, total } = getDonutData(chart)
  const arcs = toArcs(slices, total)
  const shown = focus ? arcs.find(arc => arc.id === focus) : null

  const showLegend = !!slices.length && !(width > 0 && width < 240)

  const headline = shown
    ? formatSlice(chart, shown, { withUnit: true })
    : slices.length
      ? formatReadout(chart, total)
      : "-"

  const caption = shown
    ? `${shown.name}, ${formatShare(shown.share)}`
    : slices.length
      ? [unit, "total"].filter(Boolean).join(" ")
      : "No data"

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      gap={3}
      padding={[2, 3]}
      width="100%"
      height="100%"
      overflow="hidden"
      data-testid="modern-donut"
    >
      <Svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={caption}>
        {arcs.length === 0 && (
          <circle
            cx={center}
            cy={center}
            r={ringRadius}
            fill="none"
            stroke={chart.getThemeAttribute("themeD3pieSmallColor")}
            strokeOpacity={0.35}
            strokeWidth={ringWidth}
          />
        )}
        {arcs.length === 1 && (
          <circle
            cx={center}
            cy={center}
            r={ringRadius}
            fill="none"
            stroke={arcs[0].color}
            strokeWidth={focus ? ringWidth + 4 : ringWidth}
            onMouseEnter={() => setFocus(arcs[0].id)}
            onMouseLeave={() => setFocus(null)}
            data-testid="donut-slice"
          />
        )}
        {arcs.length > 1 &&
          arcs.map(arc => (
            <Slice
              key={arc.id}
              d={arcPath(arc.a0, arc.a1)}
              stroke={arc.color}
              strokeWidth={focus === arc.id ? ringWidth + 4 : ringWidth}
              fill="none"
              opacity={focus && focus !== arc.id ? 0.25 : 1}
              onMouseEnter={() => setFocus(arc.id)}
              onMouseLeave={() => setFocus(null)}
              data-testid="donut-slice"
            />
          ))}
        <CenterValue
          x={center}
          y={center + 2}
          textAnchor="middle"
          fontSize={getCenterFontSize(headline)}
          data-testid="donut-center-value"
        >
          {headline}
        </CenterValue>
        <CenterCaption
          x={center}
          y={center + 20}
          textAnchor="middle"
          data-testid="donut-center-caption"
        >
          {caption}
        </CenterCaption>
      </Svg>
      {showLegend && <Legend chart={chart} slices={slices} focus={focus} setFocus={setFocus} />}
    </Flex>
  )
}

export default ModernDonut
