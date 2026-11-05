import React, { useMemo, useState } from "react"
import {
  Gradient,
  areaPath,
  format,
  linePath,
  makeScales,
  niceTicks,
  points,
  stats,
  wave,
  withStep,
} from "./primitives"

export const themes = {
  light: {
    ground: "#F2F4F4",
    panel: "#FFFFFF",
    border: "#E1E6E6",
    grid: "#EDF0F0",
    ink: "#1F2A30",
    muted: "#5C6C77",
    faint: "#98A5AE",
    hoverBg: "#FFFFFF",
    hoverShadow: "0 6px 24px rgba(20, 30, 35, 0.14), 0 0 0 1px rgba(20, 30, 35, 0.06)",
    chip: "#F2F4F4",
    series: [
      "#00914A",
      "#2A70D6",
      "#E0621F",
      "#5B4BC4",
      "#0B8AA3",
      "#D14F83",
      "#C08300",
      "#3F8FD0",
    ],
    crosshair: "#98A5AE",
    anomaly: "#9F75F9",
    warning: "#C98A00",
    critical: "#D63F3F",
  },
  dark: {
    ground: "#0C0F0F",
    panel: "#151818",
    border: "#232A2A",
    grid: "#1E2424",
    ink: "#E6EAEA",
    muted: "#7C8C96",
    faint: "#56646C",
    hoverBg: "#1D2323",
    hoverShadow: "0 8px 28px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
    chip: "#1D2323",
    series: [
      "#1FA35E",
      "#3F84E5",
      "#E0692E",
      "#9085E9",
      "#1A9FB3",
      "#D55181",
      "#C98500",
      "#4E9BDC",
    ],
    crosshair: "#56646C",
    anomaly: "#9F75F9",
    warning: "#E0A526",
    critical: "#E5484D",
  },
}

export const font = "'IBM Plex Sans', system-ui, sans-serif"
const startMinute = 17 * 60 + 18
const secondsPerPoint = 15

export const timeAt = index => {
  const total = startMinute * 60 + index * secondsPerPoint
  const h = Math.floor(total / 3600) % 24
  const m = Math.floor(total / 60) % 60
  const s = total % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export const datasets = {
  load: {
    title: "System load average",
    unit: "threads",
    digits: 2,
    scope: "3 dimensions from 1 node",
    filters: [
      "Group by dimension",
      "Average",
      "1 node",
      "1 instance",
      "3 dimensions",
      "2 labels",
      "Average every 4s",
    ],
    alert: { warning: 30, critical: 45 },
    annotations: [{ index: 96 }],
    series: [
      {
        id: "load1",
        values: withStep(
          wave({ center: 11, amplitude: 2.5, cycles: 3, seed: 3, noise: 0.25 }),
          96,
          6
        ),
      },
      {
        id: "load5",
        values: withStep(
          wave({ center: 15, amplitude: 1.2, cycles: 1.5, seed: 4, noise: 0.08 }),
          96,
          7
        ),
      },
      {
        id: "load15",
        values: withStep(
          wave({ center: 24, amplitude: 0.6, cycles: 1, seed: 5, noise: 0.03 }),
          96,
          8
        ),
      },
    ],
  },
  disks: {
    title: "Disk utilization",
    unit: "%",
    digits: 1,
    scope: "12 devices from 4 nodes",
    filters: [
      "Group by device",
      "Average",
      "4 nodes",
      "12 instances",
      "12 dimensions",
      "3 labels",
      "Average every 5s",
    ],
    alert: { warning: 80, critical: 90 },
    series: Array.from({ length: 12 }, (_, index) => ({
      id: `node${(index % 4) + 1}/sd${String.fromCharCode(97 + Math.floor(index / 4))}`,
      values: wave({
        center: 18 + index * 5,
        amplitude: 4 + (index % 4) * 2,
        cycles: 1.6 + (index % 5) * 0.4,
        phase: index * 0.7,
        seed: index + 11,
        noise: 0.08,
      }),
    })),
  },
}

export const Icon = ({ path, t, label }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    style={{
      width: 26,
      height: 26,
      border: 0,
      borderRadius: 6,
      background: "transparent",
      color: t.muted,
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      padding: 0,
    }}
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  </button>
)

export const icons = {
  filter: "M2 4h12M4.5 8h7M7 12h2",
  expand: "M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5 9 7M2.5 13.5 7 9",
  more: "M3.5 8h.01M8 8h.01M12.5 8h.01",
}

const Header = ({ t, data, hovered, chrome }) => (
  <header
    style={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      minHeight: 36,
    }}
  >
    <div style={{ minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <h3
          style={{ margin: 0, fontSize: 14, fontWeight: 600, color: t.ink, whiteSpace: "nowrap" }}
        >
          {data.title}
        </h3>
        <span style={{ fontSize: 12, color: t.muted }}>{data.unit}</span>
      </div>
      <button
        type="button"
        style={{
          border: 0,
          background: "transparent",
          padding: 0,
          marginTop: 2,
          fontSize: 12,
          color: t.faint,
          cursor: "pointer",
          fontFamily: font,
        }}
      >
        {data.scope}, averaged
      </button>
    </div>
    {chrome === "quiet" && (
      <div
        style={{ display: "flex", gap: 2, opacity: hovered ? 1 : 0, transition: "opacity 120ms" }}
      >
        <Icon path={icons.filter} t={t} label="Filters" />
        <Icon path={icons.expand} t={t} label="Full screen" />
        <Icon path={icons.more} t={t} label="More: settings, download, info" />
      </div>
    )}
  </header>
)

const useLayout = ({ series, width, height, rightPad }) => {
  const max = Math.max(...series.flatMap(s => s.values))
  const base = niceTicks(0, max, 3)
  const step = base[1] - base[0]
  const top = Math.ceil((max * 1.02) / step) * step
  const ticks = niceTicks(0, top, top / step)
  const scales = makeScales({ width, height, min: 0, max: top, pad: [6, rightPad, 20, 38] })
  return { scales, ticks, top }
}

export const Plot = ({
  t,
  data,
  width,
  height,
  hoverIndex,
  onHover,
  hoverMode,
  rightPad = 8,
  direct = false,
  id,
  bands = [],
  anomalies = null,
  annotations = [],
  focusId = null,
  onFocus = () => {},
}) => {
  const series = data.series.map((s, index) => ({ ...s, color: t.series[index % t.series.length] }))
  const { scales, ticks, top } = useLayout({ series, width, height, rightPad })
  const { plot } = scales

  const handleMove = event => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * width
    if (x < plot.left || x > plot.right) return onHover(null)
    onHover(Math.round(((x - plot.left) / (plot.right - plot.left)) * (points - 1)))
  }

  const labelTicks = [0, 24, 48, 72, 96]
  const hoverX = hoverIndex != null ? scales.x(hoverIndex) : null

  const directLabels = direct
    ? series
        .map(s => ({ ...s, y: scales.y(s.values[points - 1]) }))
        .sort((a, b) => a.y - b.y)
        .reduce((placed, label) => {
          const previous = placed[placed.length - 1]
          placed.push({
            ...label,
            y: previous && label.y - previous.y < 15 ? previous.y + 15 : label.y,
          })
          return placed
        }, [])
    : []

  const crossLabels =
    hoverMode === "labels" && hoverIndex != null
      ? series
          .map(s => ({ ...s, value: s.values[hoverIndex], y: scales.y(s.values[hoverIndex]) }))
          .sort((a, b) => a.y - b.y)
          .reduce((placed, label) => {
            const previous = placed[placed.length - 1]
            placed.push({
              ...label,
              ly: previous && label.y - previous.ly < 17 ? previous.ly + 17 : label.y,
            })
            return placed
          }, [])
      : []
  const labelsLeft = hoverX != null && hoverX > plot.right - 150

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: "100%", height, display: "block", cursor: "crosshair" }}
      onMouseMove={handleMove}
      onMouseLeave={() => onHover(null)}
    >
      <defs>
        {series.map((s, index) => (
          <Gradient
            key={s.id}
            id={`${id}-${index}`}
            color={s.color}
            from={series.length > 4 ? 0 : 0.18}
          />
        ))}
      </defs>
      {bands
        .filter(band => band.from <= top)
        .map((band, bandIndex, visible) => ({
          ...band,
          shift:
            bandIndex > 0 &&
            Math.abs(scales.y(band.from) - scales.y(visible[bandIndex - 1].from)) < 18
              ? visible[bandIndex - 1].label.length * 5.6 + 20
              : 0,
        }))
        .map(band => (
          <g key={band.from}>
            <rect
              x={plot.left}
              width={plot.right - plot.left}
              y={scales.y(Math.min(band.to, top))}
              height={Math.max(0, scales.y(band.from) - scales.y(Math.min(band.to, top)))}
              fill={band.color}
              opacity="0.07"
            />
            <line
              x1={plot.left}
              x2={plot.right}
              y1={scales.y(band.from)}
              y2={scales.y(band.from)}
              stroke={band.color}
              strokeDasharray="3 4"
              strokeOpacity="0.8"
            />
            <g>
              <rect
                x={plot.left + 4 + band.shift}
                y={scales.y(band.from) - 9}
                width={band.label.length * 5.6 + 12}
                height="16"
                rx="8"
                fill={t.panel}
                stroke={band.color}
                strokeOpacity="0.5"
              />
              <text
                x={plot.left + 10 + band.shift}
                y={scales.y(band.from) + 3}
                fill={band.color}
                fontSize="10.5"
                fontWeight="500"
              >
                {band.label}
              </text>
            </g>
          </g>
        ))}
      {anomalies &&
        anomalies.map((rate, index) =>
          rate > 0 ? (
            <rect
              key={index}
              x={scales.x(index) - 1.5}
              y={plot.top - 5}
              width="3"
              height="3"
              rx="1"
              fill={t.anomaly}
              opacity={0.35 + rate / 150}
            />
          ) : null
        )}
      {annotations.map(annotation => (
        <g key={annotation.index}>
          <line
            x1={scales.x(annotation.index)}
            x2={scales.x(annotation.index)}
            y1={plot.top}
            y2={plot.bottom}
            stroke={t.muted}
            strokeOpacity="0.5"
          />
          <path d={`M${scales.x(annotation.index)},${plot.top} l7,3.5 l-7,3.5 z`} fill={t.muted} />
        </g>
      ))}
      {ticks.map(tick => (
        <g key={tick}>
          <line
            x1={plot.left}
            x2={plot.right}
            y1={scales.y(tick)}
            y2={scales.y(tick)}
            stroke={t.grid}
          />
          <text
            x={plot.left - 8}
            y={scales.y(tick) + 4}
            textAnchor="end"
            fill={t.faint}
            fontSize="11"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {tick}
          </text>
        </g>
      ))}
      {series.map((s, index) => (
        <g
          key={s.id}
          opacity={focusId && focusId !== s.id ? 0.14 : 1}
          style={{ transition: "opacity 120ms" }}
        >
          {series.length <= 4 && (
            <path d={areaPath(s.values, scales, 0)} fill={`url(#${id}-${index})`} />
          )}
          <path
            d={linePath(s.values, scales)}
            fill="none"
            stroke={s.color}
            strokeWidth={series.length > 4 ? 1.5 : 2}
          />
        </g>
      ))}
      {labelTicks.map(index => (
        <text
          key={index}
          x={scales.x(index)}
          y={height - 4}
          textAnchor="middle"
          fill={t.faint}
          fontSize="11"
        >
          {timeAt(index).slice(0, 5)}
        </text>
      ))}
      {hoverX != null && (
        <g pointerEvents="none">
          <line
            x1={hoverX}
            x2={hoverX}
            y1={plot.top}
            y2={plot.bottom}
            stroke={t.crosshair}
            strokeDasharray="3 3"
          />
          {series.map(s => (
            <circle
              key={s.id}
              cx={hoverX}
              cy={scales.y(s.values[hoverIndex])}
              r="3.5"
              fill={s.color}
              stroke={t.panel}
              strokeWidth="1.5"
            />
          ))}
          {hoverMode !== "tooltip" && (
            <g>
              <rect
                x={hoverX - 30}
                y={plot.bottom + 2}
                width="60"
                height="17"
                rx="3"
                fill={t.ink}
              />
              <text
                x={hoverX}
                y={plot.bottom + 14}
                textAnchor="middle"
                fill={t.panel}
                fontSize="11"
                fontWeight="500"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {timeAt(hoverIndex)}
              </text>
            </g>
          )}
          {crossLabels.map(label => {
            const x = labelsLeft ? hoverX - 10 : hoverX + 10
            return (
              <g key={label.id}>
                <rect
                  x={labelsLeft ? x - 112 : x}
                  y={label.ly - 8}
                  width="112"
                  height="16"
                  rx="3"
                  fill={t.hoverBg}
                  opacity="0.94"
                />
                <text
                  x={labelsLeft ? x - 6 : x + 6}
                  y={label.ly + 4}
                  textAnchor={labelsLeft ? "end" : "start"}
                  fontSize="11"
                >
                  <tspan fill={label.color} fontWeight="600">
                    {label.id.length > 9 ? `${label.id.slice(0, 9)}…` : label.id}
                  </tspan>
                  <tspan
                    fill={t.ink}
                    fontWeight="600"
                    dx="6"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {format(label.value, data.digits)}
                  </tspan>
                </text>
              </g>
            )
          })}
        </g>
      )}
      {directLabels.map(label => (
        <text
          key={label.id}
          onMouseEnter={() => onFocus(label.id)}
          onMouseLeave={() => onFocus(null)}
          style={{ cursor: "pointer" }}
          x={plot.right + 8}
          y={label.y + 4}
          fontSize="12"
        >
          <tspan fill={label.color} fontWeight="600">
            {label.id}
          </tspan>
          <tspan
            fill={t.ink}
            dx="6"
            fontWeight="600"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {format(
              hoverIndex != null ? label.values[hoverIndex] : label.values[points - 1],
              data.digits
            )}
          </tspan>
        </text>
      ))}
    </svg>
  )
}

export const Tooltip = ({ t, data, hoverIndex, leftPct }) => {
  const series = data.series
    .map((s, index) => ({
      ...s,
      color: t.series[index % t.series.length],
      value: s.values[hoverIndex],
    }))
    .sort((a, b) => b.value - a.value)
  const shown = series.slice(0, 6)
  const flip = leftPct > 55

  return (
    <div
      style={{
        position: "absolute",
        top: 8,
        [flip ? "right" : "left"]: flip
          ? `calc(${100 - leftPct}% + 14px)`
          : `calc(${leftPct}% + 14px)`,
        background: t.hoverBg,
        boxShadow: t.hoverShadow,
        borderRadius: 8,
        padding: "8px 10px",
        minWidth: 170,
        pointerEvents: "none",
        fontSize: 12,
        zIndex: 2,
      }}
    >
      <div style={{ color: t.muted, marginBottom: 6, fontVariantNumeric: "tabular-nums" }}>
        {timeAt(hoverIndex)}
      </div>
      {shown.map(s => (
        <div
          key={s.id}
          style={{
            display: "grid",
            gridTemplateColumns: "10px 1fr auto",
            alignItems: "center",
            gap: 8,
            padding: "2px 0",
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
          <span style={{ color: t.ink, whiteSpace: "nowrap" }}>{s.id}</span>
          <span
            style={{
              color: t.ink,
              fontWeight: 600,
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {format(s.value, data.digits)}
          </span>
        </div>
      ))}
      {series.length > shown.length && (
        <div style={{ color: t.faint, marginTop: 4 }}>
          {series.length - shown.length} more below the lowest shown
        </div>
      )}
    </div>
  )
}

export const LegendBelow = ({ t, data, hoverIndex }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", paddingTop: 4 }}>
    {data.series.slice(0, 8).map((s, index) => {
      const value = hoverIndex != null ? s.values[hoverIndex] : s.values[points - 1]
      return (
        <span
          key={s.id}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
        >
          <span
            style={{
              width: 10,
              height: 3,
              borderRadius: 2,
              background: t.series[index % t.series.length],
            }}
          />
          <span style={{ color: t.muted }}>{s.id}</span>
          <span style={{ color: t.ink, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            {format(value, data.digits)}
          </span>
        </span>
      )
    })}
    {data.series.length > 8 && (
      <span style={{ fontSize: 12, color: t.faint }}>+{data.series.length - 8} more</span>
    )}
  </div>
)

export const LegendTable = ({ t, data, hoverIndex, compact = false, onFocus = () => {} }) => {
  const rows = data.series
    .map((s, index) => ({
      ...s,
      color: t.series[index % t.series.length],
      ...stats(s.values),
      now: hoverIndex != null ? s.values[hoverIndex] : s.values[points - 1],
    }))
    .sort((a, b) => b.now - a.now)
  const cell = {
    padding: compact ? "3px 0 3px 12px" : "5px 0 5px 14px",
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
  }

  return (
    <div style={{ position: "relative" }}>
      {rows.length > 8 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 36,
            background: `linear-gradient(transparent, ${t.panel})`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}
      <div style={{ overflow: "auto", maxHeight: compact ? 230 : undefined }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ color: t.faint }}>
              <th style={{ textAlign: "left", fontWeight: 400, padding: "3px 0" }}>
                {hoverIndex != null ? timeAt(hoverIndex) : "Name"}
              </th>
              <th style={{ ...cell, fontWeight: 400 }}>
                {hoverIndex != null ? "At cursor" : "Last"}
              </th>
              <th style={{ ...cell, fontWeight: 400 }}>Mean</th>
              <th style={{ ...cell, fontWeight: 400 }}>Max</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.id}
                onMouseEnter={() => onFocus(row.id)}
                onMouseLeave={() => onFocus(null)}
                style={{ borderTop: `1px solid ${t.grid}`, cursor: "pointer" }}
              >
                <td
                  style={{
                    padding: compact ? "3px 0" : "5px 0",
                    color: t.ink,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 10,
                      height: 3,
                      borderRadius: 2,
                      background: row.color,
                      marginRight: 8,
                      verticalAlign: "middle",
                    }}
                  />
                  {row.id}
                </td>
                <td style={{ ...cell, color: t.ink, fontWeight: 600 }}>
                  {format(row.now, data.digits)}
                </td>
                <td style={{ ...cell, color: t.muted }}>{format(row.mean, data.digits)}</td>
                <td style={{ ...cell, color: t.muted }}>{format(row.max, data.digits)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const ChartCard = ({
  theme = "light",
  dataset = "load",
  legend = "below",
  hoverMode = "tooltip",
  chrome = "quiet",
  width = 640,
  height = 200,
  caption,
}) => {
  const t = themes[theme]
  const data = datasets[dataset]
  const [hoverIndex, setHoverIndex] = useState(null)
  const [hovered, setHovered] = useState(false)
  const id = useMemo(() => `card-${Math.random().toString(36).slice(2, 8)}`, [])
  const side = legend === "right"
  const plotWidth = side ? width * 0.6 : width
  const direct = legend === "direct"
  const leftPct = hoverIndex != null ? (hoverIndex / (points - 1)) * 100 : 0

  return (
    <figure
      style={{ margin: 0, display: "flex", flexDirection: "column", gap: 8, fontFamily: font }}
    >
      {caption && (
        <figcaption style={{ fontSize: 13, color: t.muted, fontFamily: font }}>
          {caption}
        </figcaption>
      )}
      <section
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: t.panel,
          border: `1px solid ${t.border}`,
          borderRadius: 10,
          padding: "12px 14px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          width,
        }}
      >
        <Header t={t} data={data} hovered={hovered} chrome={chrome} />
        <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
          <div style={{ position: "relative", flex: side ? "0 0 60%" : 1, minWidth: 0 }}>
            <Plot
              t={t}
              data={data}
              width={plotWidth}
              height={height}
              hoverIndex={hoverIndex}
              onHover={setHoverIndex}
              hoverMode={hoverMode}
              direct={direct}
              rightPad={direct ? 120 : 8}
              id={id}
            />
            {hoverMode === "tooltip" && hoverIndex != null && (
              <Tooltip t={t} data={data} hoverIndex={hoverIndex} leftPct={leftPct} />
            )}
          </div>
          {side && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <LegendTable
                t={t}
                data={data}
                hoverIndex={hoverMode === "legend" ? hoverIndex : null}
                compact
              />
            </div>
          )}
        </div>
        {legend === "below" && (
          <LegendBelow t={t} data={data} hoverIndex={hoverMode === "legend" ? hoverIndex : null} />
        )}
        {legend === "table" && (
          <LegendTable t={t} data={data} hoverIndex={hoverMode === "legend" ? hoverIndex : null} />
        )}
      </section>
    </figure>
  )
}

export const Ground = ({ theme = "light", children, columns = 2 }) => (
  <div
    style={{
      background: themes[theme].ground,
      padding: 28,
      minHeight: "100vh",
      boxSizing: "border-box",
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, max-content)`,
      gap: 28,
      alignContent: "start",
    }}
  >
    {children}
  </div>
)
