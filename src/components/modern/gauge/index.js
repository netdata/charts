import React from "react"
import styled, { keyframes, useTheme } from "styled-components"
import { Flex, Text, getColor } from "@netdata/netdata-ui"
import ChartContainer from "@/components/chartContainer"
import {
  useChart,
  useAttributeValue,
  useOnResize,
  useLatestDisplayValueWithUnit,
  useValueWithUnit,
  useVisibleDimensionIds,
} from "@/components/provider"
import { ChartWrapper } from "@/components/hocs/withTile"
import { numeralsFont, radius as radii } from "@/components/modern/tokens"
import {
  viewBox,
  center,
  radius,
  zoneRadius,
  startAngle,
  endAngle,
  toFraction,
  fractionToAngle,
  polar,
  arcPath,
  sumRow,
  sparklinePath,
} from "./geometry"
import { makeZones, zoneAt, alertSeverity, worstSeverity } from "./zones"

const { cx, cy } = center
const spark = { x: cx - 56, y: cy + 14, width: 112, height: 26 }
const numerals = { fontVariantNumeric: "tabular-nums" }

const labels = { warning: "Warning", critical: "Critical" }
const pillColors = { warning: "warning", critical: "error" }

const toId = value => String(value).replace(/[^\w-]/g, "_")

const Pill = styled(Flex).attrs({ alignItems: "center" })`
  border-radius: ${radii.pill};
  padding: 2px 8px;
`

const Dot = styled.span`
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: ${radii.pill};
  background: ${({ color }) => color};
`

export const Attention = ({ severity, showQuiet, dotColor, ...rest }) => {
  if (severity === "warning" || severity === "critical")
    return (
      <Pill
        data-testid="modernGauge-attention"
        data-severity={severity}
        background={pillColors[severity]}
        {...rest}
      >
        <Text fontSize="11px" lineHeight="16px" color="mainChartBg" whiteSpace="nowrap" strong>
          {labels[severity]}
        </Text>
      </Pill>
    )

  if (!showQuiet) return null

  return (
    <Flex
      data-testid="modernGauge-attention"
      data-severity="ok"
      alignItems="center"
      gap={1}
      {...rest}
    >
      <Dot color={dotColor} />
      <Text fontSize="12px" color="textLite" whiteSpace="nowrap">
        Within thresholds
      </Text>
    </Flex>
  )
}

const AttentionContainer = styled(Flex).attrs({ position: "absolute" })`
  top: 4px;
  right: 4px;
  z-index: 1;
`

const useBound = (value, dimensionId) =>
  useValueWithUnit(value, { dimensionId, scaleByValue: true })

const boundLabel = ({ convertedValue, convertedUnit }, centreUnit) =>
  convertedUnit && convertedUnit !== centreUnit
    ? `${convertedValue} ${convertedUnit}`
    : `${convertedValue}`

const valueFontSize = text => {
  const length = String(text).length
  return length > 5 ? Math.max(22, (44 * 5) / length) : 44
}

export const Dial = ({ uiName }) => {
  const chart = useChart()
  const theme = useTheme()
  const { width } = useOnResize(uiName)
  const [dimensionId] = useVisibleDimensionIds()
  const { convertedValue, convertedUnit } = useLatestDisplayValueWithUnit(dimensionId)
  const thresholds = useAttributeValue("gaugeThresholds")
  const alerts = useAttributeValue("alerts")
  const hoverX = useAttributeValue("hoverX")
  const themeName = useAttributeValue("theme")

  const [min, max] = chart.getUI(uiName)?.getMinMax?.() || [null, null]
  const minBound = useBound(min, dimensionId)
  const maxBound = useBound(max, dimensionId)

  const { data = [] } = chart.getPayload() || {}
  const rowIndex = hoverX && data.length ? chart.getClosestRow(hoverX[0]) : data.length - 1
  const value = sumRow(data[rowIndex])
  const series = data.map(sumRow)

  const zones = makeZones(thresholds, min, max, chart.getThemeIndex())
  const zone = zoneAt(zones, value)
  const zoneSeverity = zone?.severity || "ok"
  const severity = worstSeverity(zoneSeverity, alertSeverity(alerts))

  const color = token => getColor(token)({ theme })
  const baseColor = chart.selectDimensionColor()
  const valueColor = zoneSeverity !== "ok" ? zone.color : baseColor
  const at = v => fractionToAngle(toFraction(v, min, max))
  const valueAngle = at(value)
  const [knobX, knobY] = polar(cx, cy, radius, valueAngle)
  const { line, area } = sparklinePath(series, { width: spark.width, height: spark.height })

  const id = toId(`gauge-${chart.getId()}-${uiName || "default"}-${themeName}`)
  const hasZones = zones.length > 0
  const hasAlerts = Object.keys(alerts || {}).length > 0
  const label = convertedUnit ? `${convertedValue} ${convertedUnit}` : `${convertedValue}`

  return (
    <>
      <AttentionContainer>
        <Attention
          severity={severity}
          showQuiet={(hasZones || hasAlerts) && width >= 200}
          dotColor={color("success")}
        />
      </AttentionContainer>
      <svg
        data-testid="modernGauge"
        role="img"
        aria-label={label}
        viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
      >
        <defs>
          <linearGradient id={`${id}-arc`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={valueColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={valueColor} />
          </linearGradient>
          <linearGradient id={`${id}-spark`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={valueColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={valueColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          data-testid="modernGauge-track"
          d={arcPath(cx, cy, radius, startAngle, endAngle)}
          stroke={color("borderSecondary")}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
        {zones
          .filter(z => z.severity !== "ok")
          .map(z => (
            <path
              key={z.id}
              data-testid="modernGauge-zone"
              data-severity={z.severity}
              d={arcPath(cx, cy, zoneRadius, at(z.from), at(z.to))}
              stroke={z.color}
              strokeWidth="3"
              fill="none"
            />
          ))}
        {value !== null && valueAngle - startAngle > 0.001 && (
          <path
            data-testid="modernGauge-value"
            d={arcPath(cx, cy, radius, startAngle, valueAngle)}
            stroke={`url(#${id}-arc)`}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {value !== null && (
          <circle
            data-testid="modernGauge-knob"
            cx={knobX}
            cy={knobY}
            r="7"
            fill={color("mainChartBg")}
            stroke={valueColor}
            strokeWidth="3"
          />
        )}
        <text
          data-testid="modernGauge-number"
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fill={zoneSeverity === "ok" ? color("text") : valueColor}
          fontFamily={numeralsFont}
          fontSize={valueFontSize(convertedValue)}
          fontWeight="600"
          style={numerals}
        >
          {convertedValue}
          {!!convertedUnit && (
            <tspan fontSize="16" fontWeight="400" fill={color("textLite")} dx="3">
              {convertedUnit}
            </tspan>
          )}
        </text>
        {!!line && (
          <g data-testid="modernGauge-sparkline" transform={`translate(${spark.x},${spark.y})`}>
            <path d={area} fill={`url(#${id}-spark)`} />
            <path d={line} fill="none" stroke={valueColor} strokeWidth="1.5" />
          </g>
        )}
        <text
          data-testid="modernGauge-min"
          x={polar(cx, cy, radius, startAngle)[0]}
          y={cy + 80}
          textAnchor="middle"
          fill={color("textLite")}
          fontFamily={numeralsFont}
          fontSize="11"
          style={numerals}
        >
          {boundLabel(minBound, convertedUnit)}
        </text>
        <text
          data-testid="modernGauge-max"
          x={polar(cx, cy, radius, endAngle)[0]}
          y={cy + 80}
          textAnchor="middle"
          fill={color("textLite")}
          fontFamily={numeralsFont}
          fontSize="11"
          style={numerals}
        >
          {boundLabel(maxBound, convertedUnit)}
        </text>
      </svg>
    </>
  )
}

const frames = keyframes`
  from { opacity: 0.2; }
  to { opacity: 0.6; }
`

const SkeletonRing = styled.svg`
  animation: ${frames} 1.6s ease-in infinite;
`

export const Skeleton = () => {
  const theme = useTheme()
  return (
    <SkeletonRing
      data-testid="modernGauge-skeleton"
      viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
      width="100%"
      height="100%"
    >
      <path
        d={arcPath(cx, cy, radius, startAngle, endAngle)}
        stroke={getColor("borderSecondary")({ theme })}
        strokeWidth="12"
        fill="none"
        strokeLinecap="round"
      />
    </SkeletonRing>
  )
}

export const ModernGauge = ({ uiName, ref, ...rest }) => {
  const loaded = useAttributeValue("loaded")

  return (
    <ChartWrapper alignItems="center" justifyContent="center" column ref={ref} gap={0}>
      {loaded ? (
        <ChartContainer
          uiName={uiName}
          position="relative"
          justifyContent="center"
          alignItems="center"
          overflow="hidden"
          {...rest}
        >
          <Dial uiName={uiName} />
        </ChartContainer>
      ) : (
        <Skeleton />
      )}
    </ChartWrapper>
  )
}

export default ModernGauge
