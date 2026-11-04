import React from "react"
import { useTheme } from "styled-components"
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
import {
  formatReadout,
  formatReadoutUnit,
  getReadoutUnitAttributes,
} from "@/components/modern/format"
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
  trendBox,
  legibleSize,
  valueBaseline,
  fitValueFontSize,
  unitFontSize,
} from "./geometry"
import { makeZones, zoneAt, alertSeverity, worstSeverity } from "./zones"
import { SkeletonSvg, Comet, ReadoutPills, useSkeletonColors } from "@/components/skeleton"
import { useValueFocus } from "@/components/modern/focus"
import { describeWindowChange } from "@/helpers/valueFocus"

const { cx, cy } = center
const numerals = { fontVariantNumeric: "tabular-nums" }
const compactScale = 0.75
const flatTrendTop = 0.62

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

  return {
    min,
    max,
    data,
    rowIndex,
    value,
    zones,
    zone,
    zoneSeverity,
    alertLevel,
    severity,
    alerts,
  }
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
    <Flex
      justifyContent="end"
      alignItems="center"
      position="absolute"
      top={0}
      right={0}
      zIndex={1}
      padding={[0, 1]}
      data-testid="modernGauge-attentionRow"
    >
      <Attention severity={severity} showQuiet={showQuiet} {...details} />
    </Flex>
  )
}

const splitPercent = text => (text.endsWith("%") ? [text.slice(0, -1), "%"] : [text, ""])

const UnitSpan = ({ unit, size, fill, dx = 2 }) =>
  !!unit && (
    <tspan fontSize={size} fontWeight="400" fill={fill} dx={dx}>
      {unit}
    </tspan>
  )

const ChangeCenter = ({ change, unit, scale, color }) => {
  if (!change.moved)
    return (
      <>
        <text
          data-testid="modernGauge-noChange"
          x={cx}
          y={cy - 14}
          textAnchor="middle"
          fill={color("textLite")}
          fontSize={legibleSize(26, scale)}
          fontWeight="500"
        >
          No change
        </text>
        <text
          data-testid="modernGauge-steady"
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          fill={color("textLite")}
          fontFamily={numeralsFont}
          fontSize={legibleSize(17, scale)}
          style={numerals}
        >
          {change.varied ? "now at " : "steady at "}
          <tspan fill={color("text")} fontWeight="600">
            {change.to}
          </tspan>
          <UnitSpan unit={unit} fill={color("text")} dx={unit === "%" ? 0 : 3} />
        </text>
      </>
    )

  const [number, percent] = splitPercent(change.delta)
  const size = Math.min(38, fitValueFontSize(`${number}${percent} `, ""))
  const percentSize = Math.round(size * 0.45)
  const arrowWidth = size * 0.36
  const gap = size * 0.15
  const textWidth = number.length * 0.6 * size + (percent ? 0.6 * percentSize + 2 : 0)
  const left = cx - (arrowWidth + gap + textWidth) / 2
  const arrowX = left + arrowWidth / 2
  const arrowTop = cy - 10 - size * 0.68
  const arrowBottom = cy - 10
  const head = arrowWidth / 2

  return (
    <>
      <path
        data-testid="modernGauge-arrow"
        data-direction={change.direction}
        aria-hidden="true"
        d={`M${arrowX},${arrowBottom}V${arrowTop}M${arrowX - head},${arrowTop + head}L${arrowX},${arrowTop}L${arrowX + head},${arrowTop + head}`}
        transform={
          change.direction === "down"
            ? `rotate(180 ${arrowX} ${(arrowTop + arrowBottom) / 2})`
            : undefined
        }
        fill="none"
        stroke={color("text")}
        strokeWidth={size * 0.085}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        data-testid="modernGauge-delta"
        x={left + arrowWidth + gap}
        y={cy - 10}
        textAnchor="start"
        fill={color("text")}
        fontFamily={numeralsFont}
        fontSize={size}
        fontWeight="600"
        style={numerals}
      >
        {number}
        <UnitSpan unit={percent} size={percentSize} fill={color("textLite")} />
      </text>
      <text
        data-testid="modernGauge-fromTo"
        x={cx}
        y={cy + 20}
        textAnchor="middle"
        fill={color("textLite")}
        fontFamily={numeralsFont}
        fontSize={legibleSize(17, scale)}
        style={numerals}
      >
        <tspan opacity="0.7">{change.from}</tspan>
        {" → "}
        <tspan fill={color("text")} fontWeight="600">
          {change.to}
        </tspan>
        <UnitSpan unit={unit} fill={color("text")} dx={unit === "%" ? 0 : 3} />
      </text>
    </>
  )
}

const TrendLine = ({ series, change, scale, color, valueColor, gradientId }) => {
  const box = trendBox(scale)
  const flat = !change?.varied
  const { line, area, start, end } = sparklinePath(series, box)
  if (!line) return null

  const tint = flat ? color("textLite") : valueColor
  const flatY = box.height * flatTrendTop
  const [startX, startY] = flat ? [0, flatY] : start
  const [endX, endY] = flat ? [box.width, flatY] : end

  return (
    <g
      data-testid="modernGauge-sparkline"
      data-width={box.width}
      data-height={box.height}
      data-flat={flat || undefined}
      transform={`translate(${cx - box.width / 2},${cy + 2})`}
    >
      {!!change && <title>{change.detail}</title>}
      {flat ? (
        <path
          d={`M0,${flatY} L${box.width},${flatY}`}
          fill="none"
          stroke={tint}
          strokeOpacity="0.55"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      ) : (
        <>
          <path d={area} fill={`url(#${gradientId})`} />
          <path d={line} fill="none" stroke={tint} strokeWidth="1.75" strokeLinejoin="round" />
        </>
      )}
      <circle
        data-testid="modernGauge-sparkStart"
        cx={startX}
        cy={startY}
        r="3"
        fill={color("mainChartBg")}
        stroke={tint}
        strokeWidth="1.5"
      />
      <circle data-testid="modernGauge-sparkEnd" cx={endX} cy={endY} r="3.5" fill={tint} />
    </g>
  )
}

const valueArcOpacity = { totals: 1, changes: 0.55, trends: 0.7 }

export const Dial = ({ uiName }) => {
  const chart = useChart()
  const theme = useTheme()
  const { width, height } = useOnResize(uiName)
  const [dimensionId] = useVisibleDimensionIds()
  const latest = useLatestDisplayValue(dimensionId, { allowNull: true })
  const themeName = useAttributeValue("theme")
  useAttributeValue("staticFractionDigits")

  const { min, max, data, rowIndex, value, zones, zone, zoneSeverity } = useDialState(uiName)
  const focus = useValueFocus("gauge")
  const unitAttributes = getReadoutUnitAttributes(chart, latest, { dimensionId })
  const readout = formatReadout(chart, latest, { dimensionId, unitAttributes })
  const unit = formatReadoutUnit(chart, latest, { dimensionId, unitAttributes })
  const withUnit = edge => {
    const text = formatReadout(chart, edge, { dimensionId })
    const edgeUnit = formatReadoutUnit(chart, edge, { dimensionId })
    return text !== "-" && edgeUnit ? `${text} ${edgeUnit}` : text
  }
  const minLabel = withUnit(min)
  const maxLabel = withUnit(max)
  const scale =
    width > 0 && height > 0 ? Math.min(width / viewBox.width, height / viewBox.height) : 1

  const series = data.map(sumRow)
  const change =
    focus === "totals" || value === null
      ? null
      : describeWindowChange(chart, series, { dimensionId, unitAttributes, unit, index: rowIndex })
  const mode = change ? focus : "totals"
  const ghost = mode === "changes" && change.moved

  const color = token => getColor(token)({ theme })
  const baseColor = chart.selectDimensionColor()
  const valueColor = zoneSeverity !== "ok" ? zone.color : baseColor
  const at = v => fractionToAngle(toFraction(v, min, max))
  const valueAngle = at(value)
  const [knobX, knobY] = polar(cx, cy, radius, valueAngle)

  const fromValue = ghost ? Number(series.filter(v => typeof v === "number")[0]) : value
  const fromAngle = ghost ? at(fromValue) : valueAngle
  const solidAngle = Math.min(fromAngle, valueAngle)
  const ghostFrom = Math.min(fromAngle, valueAngle)
  const ghostTo = Math.max(fromAngle, valueAngle)
  const [tickInX, tickInY] = polar(cx, cy, radius - 11, fromAngle)
  const [tickOutX, tickOutY] = polar(cx, cy, radius + 11, fromAngle)

  const trendValueSize = legibleSize(Math.min(34, fitValueFontSize(readout, unit)), scale)
  const valueSize = mode === "trends" ? trendValueSize : fitValueFontSize(readout, unit)
  const valueY = mode === "trends" ? cy - 30 : cy - valueBaseline
  const compact = scale < compactScale

  const id = toId(`gauge-${chart.getId()}-${uiName || "default"}-${themeName}`)
  const label = unit ? `${readout} ${unit}` : readout
  const ariaLabel =
    mode === "changes" ? change.label : mode === "trends" ? `${label}. ${change.label}` : label

  return (
    <svg
      data-testid="modernGauge"
      data-focus={mode}
      role="img"
      aria-label={ariaLabel}
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
          <stop offset="0%" stopColor={valueColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={valueColor} stopOpacity="0" />
        </linearGradient>
        <pattern
          id={`${id}-hatch`}
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="5" height="5" fill={valueColor} fillOpacity="0.28" />
          <rect width="2" height="5" fill={valueColor} fillOpacity="0.75" />
        </pattern>
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
      {value !== null && solidAngle - startAngle > 0.001 && (
        <path
          data-testid="modernGauge-value"
          d={arcPath(cx, cy, radius, startAngle, solidAngle)}
          stroke={ghost ? valueColor : `url(#${id}-arc)`}
          strokeOpacity={valueArcOpacity[mode]}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {ghost && ghostTo - ghostFrom > 0.001 && (
        <path
          data-testid="modernGauge-ghost"
          d={arcPath(cx, cy, radius, ghostFrom, ghostTo)}
          stroke={`url(#${id}-hatch)`}
          strokeWidth="12"
          fill="none"
        />
      )}
      {ghost && (
        <line
          data-testid="modernGauge-startTick"
          x1={tickInX}
          y1={tickInY}
          x2={tickOutX}
          y2={tickOutY}
          stroke={color("text")}
          strokeWidth="3"
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
      {mode === "changes" ? (
        <ChangeCenter change={change} unit={unit} scale={scale} color={color} />
      ) : (
        <text
          data-testid="modernGauge-number"
          x={cx}
          y={valueY}
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
      )}
      {mode === "trends" && (
        <>
          <text
            data-testid="modernGauge-delta"
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            fill={color("textLite")}
            fontFamily={numeralsFont}
            fontSize={legibleSize(15, scale)}
            style={numerals}
          >
            {change.moved ? (
              <>
                <tspan fill={color("text")} fontWeight="600">
                  {change.delta}
                </tspan>
                {!compact && <tspan>{change.text.slice(change.delta.length)}</tspan>}
              </>
            ) : (
              change.text
            )}
          </text>
          <TrendLine
            series={series}
            change={change}
            scale={scale}
            color={color}
            valueColor={valueColor}
            gradientId={`${id}-spark`}
          />
        </>
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
  const { track, spark } = useSkeletonColors()
  const d = arcPath(cx, cy, radius, startAngle, endAngle)
  return (
    <SkeletonSvg
      data-testid="modernGauge-skeleton"
      viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
      width="100%"
      height="100%"
    >
      <path d={d} stroke={track} strokeWidth="8" fill="none" strokeLinecap="round" />
      <Comet d={d} width="8" color={spark} />
      <ReadoutPills cx={cx} cy={cy - 8} scale={2} color={track} />
    </SkeletonSvg>
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
