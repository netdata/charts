import React from "react"
import styled, { useTheme } from "styled-components"
import { Flex, getColor } from "@netdata/netdata-ui"
import ChartContainer from "@/components/chartContainer"
import {
  useChart,
  useAttributeValue,
  useOnResize,
  useLatestDisplayValue,
  useVisibleDimensionIds,
} from "@/components/provider"
import { ChartWrapper } from "@/components/hocs/withTile"
import { numeralsFont } from "@/components/modern/tokens"
import { formatReadout, formatReadoutUnit } from "@/components/modern/format"
import StatusIndicator, { getClearDescription, summarizeAlerts } from "@/components/modern/status"
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
  valueBaseline,
  fitValueFontSize,
  unitFontSize,
} from "./geometry"
import { makeZones, zoneAt, alertSeverity, worstSeverity } from "./zones"
import { ReadoutPills, useSkeletonColors } from "@/components/skeleton"

const { cx, cy } = center
const spark = { x: cx - 56, y: cy + 14, width: 112, height: 26 }
const numerals = { fontVariantNumeric: "tabular-nums" }

const toId = value => String(value).replace(/[^\w-]/g, "_")

const zoneDescription = severity => `The value is in a ${severity} zone of the gauge thresholds`

export const Attention = ({ severity, showQuiet, description, ...rest }) => {
  if (severity === "warning" || severity === "critical")
    return (
      <StatusIndicator
        status={severity}
        description={description}
        data-testid="modernGauge-attention"
        data-severity={severity}
        {...rest}
      />
    )

  if (!showQuiet) return null

  return (
    <StatusIndicator
      status="clear"
      description={description || "Within the gauge thresholds"}
      data-testid="modernGauge-attention"
      data-severity="ok"
      {...rest}
    />
  )
}

const AttentionRow = styled(Flex).attrs({ justifyContent: "end", alignItems: "center" })`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  padding: 0 4px;
`

const useDialState = uiName => {
  const chart = useChart()
  const thresholds = useAttributeValue("gaugeThresholds")
  const alerts = useAttributeValue("alerts")
  const hoverX = useAttributeValue("hoverX")

  const [min, max] = chart.getUI(uiName)?.getMinMax?.() || [null, null]
  const { data = [] } = chart.getPayload() || {}
  const rowIndex = hoverX && data.length ? chart.getClosestRow(hoverX[0]) : data.length - 1
  const value = sumRow(data[rowIndex])

  const zones = makeZones(thresholds, min, max, chart.getThemeIndex())
  const zone = zoneAt(zones, value)
  const zoneSeverity = zone?.severity || "ok"
  const alertLevel = alertSeverity(alerts)
  const severity = worstSeverity(zoneSeverity, alertLevel)

  return { min, max, data, value, zones, zone, zoneSeverity, alertLevel, severity, alerts }
}

const useStatusDetails = ({ zones, zoneSeverity, alertLevel, severity, alerts }) => {
  const summary = summarizeAlerts(alerts)

  if (severity === "ok")
    return {
      description: [
        zones.length > 0 && "Within the gauge thresholds",
        summary.watching > 0 && getClearDescription(summary.watching),
      ],
    }

  const fromAlerts = alertLevel === severity
  return {
    count: fromAlerts ? summary[severity].count : null,
    names: fromAlerts ? summary.raisedNames : [],
    description: zoneSeverity === severity ? zoneDescription(severity) : null,
  }
}

export const GaugeAttention = ({ uiName }) => {
  const { width } = useOnResize(uiName)
  const state = useDialState(uiName)
  const details = useStatusDetails(state)
  const { zones, severity, alerts } = state

  const hasAlerts = Object.keys(alerts || {}).length > 0
  const showQuiet = (zones.length > 0 || hasAlerts) && width >= 200
  if (severity === "ok" && !showQuiet) return null

  return (
    <AttentionRow data-testid="modernGauge-attentionRow">
      <Attention severity={severity} showQuiet={showQuiet} {...details} />
    </AttentionRow>
  )
}

export const Dial = ({ uiName }) => {
  const chart = useChart()
  const theme = useTheme()
  useOnResize(uiName)
  const [dimensionId] = useVisibleDimensionIds()
  const latest = useLatestDisplayValue(dimensionId, { allowNull: true })
  const themeName = useAttributeValue("theme")
  useAttributeValue("staticFractionDigits")

  const { min, max, data, value, zones, zone, zoneSeverity } = useDialState(uiName)
  const readout = formatReadout(chart, latest, { dimensionId })
  const unit = formatReadoutUnit(chart, latest, { dimensionId })
  const withUnit = edge => {
    const text = formatReadout(chart, edge, { dimensionId })
    const edgeUnit = formatReadoutUnit(chart, edge, { dimensionId })
    return text !== "-" && edgeUnit ? `${text} ${edgeUnit}` : text
  }
  const minLabel = withUnit(min)
  const maxLabel = withUnit(max)
  const valueSize = fitValueFontSize(readout, unit)

  const series = data.map(sumRow)

  const color = token => getColor(token)({ theme })
  const baseColor = chart.selectDimensionColor()
  const valueColor = zoneSeverity !== "ok" ? zone.color : baseColor
  const at = v => fractionToAngle(toFraction(v, min, max))
  const valueAngle = at(value)
  const [knobX, knobY] = polar(cx, cy, radius, valueAngle)
  const { line, area } = sparklinePath(series, { width: spark.width, height: spark.height })

  const id = toId(`gauge-${chart.getId()}-${uiName || "default"}-${themeName}`)
  const label = unit ? `${readout} ${unit}` : readout

  return (
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
        y={cy - valueBaseline}
        textAnchor="middle"
        fill={zoneSeverity === "ok" ? color("text") : valueColor}
        fontFamily={numeralsFont}
        fontSize={valueSize}
        fontWeight="600"
        style={numerals}
      >
        {readout}
        {!!unit && (
          <tspan
            fontSize={unitFontSize(valueSize)}
            fontWeight="400"
            fill={color("textLite")}
            dx="3"
          >
            {unit}
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
        {minLabel}
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
        {maxLabel}
      </text>
    </svg>
  )
}

export const Skeleton = () => {
  const { track } = useSkeletonColors()
  return (
    <svg
      data-testid="modernGauge-skeleton"
      viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
      width="100%"
      height="100%"
    >
      <path
        d={arcPath(cx, cy, radius, startAngle, endAngle)}
        stroke={track}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      <ReadoutPills cx={cx} cy={cy - 8} scale={2} color={track} />
    </svg>
  )
}

export const ModernGauge = ({ uiName, ref, ...rest }) => {
  const loaded = useAttributeValue("loaded")

  return (
    <ChartWrapper alignItems="center" justifyContent="center" column ref={ref} gap={0}>
      {loaded ? (
        <>
          <GaugeAttention uiName={uiName} />
          <ChartContainer
            uiName={uiName}
            position="relative"
            justifyContent="center"
            alignItems="center"
            overflow="hidden"
            sx={{ flex: "1 1 0", minHeight: 0 }}
            {...rest}
          >
            <Dial uiName={uiName} />
          </ChartContainer>
        </>
      ) : (
        <Skeleton />
      )}
    </ChartWrapper>
  )
}

export default ModernGauge
