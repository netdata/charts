import React from "react"
import {
  Gradient,
  Sparkline,
  areaPath,
  arcPath,
  dashboardData as data,
  format,
  linePath,
  makeScales,
  niceTicks,
  polar,
  stats,
  timeLabels,
} from "./primitives"

const t = {
  ground: "#0C0F0F",
  panel: "#151818",
  border: "#212727",
  grid: "#1E2424",
  ink: "#E6EAEA",
  muted: "#7C8C96",
  series: ["#1FA35E", "#3F84E5", "#E0692E", "#9085E9"],
  ok: "#2A7F57",
  warning: "#E0A526",
  critical: "#E5484D",
  off: "#323B3B",
  font: "'IBM Plex Sans', system-ui, sans-serif",
}

const Panel = ({ title, scope, span, children, pad = 16 }) => (
  <section
    style={{
      gridColumn: `span ${span}`,
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 8,
      padding: pad,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      minWidth: 0,
    }}
  >
    <header style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500, color: t.ink }}>{title}</h3>
      {scope && <span style={{ fontSize: 12, color: t.muted }}>{scope}</span>}
    </header>
    {children}
  </section>
)

const Value = ({ value, unit, size = 34 }) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
    <span
      style={{
        fontSize: size,
        fontWeight: 600,
        color: t.ink,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}
    >
      {value}
    </span>
    <span style={{ fontSize: 14, color: t.muted }}>{unit}</span>
  </div>
)

const Stat = ({ title, scope, values, unit, digits, color, id }) => (
  <Panel title={title} scope={scope} span={3}>
    <Value value={format(stats(values).last, digits)} unit={unit} />
    <div style={{ margin: "0 -16px -16px", height: 44 }}>
      <Sparkline values={values} color={color} height={44} width={300} id={id} />
    </div>
  </Panel>
)

const Gauge = ({ value, values }) => {
  const size = 220
  const cx = size / 2
  const cy = 118
  const r = 86
  const a0 = Math.PI * 0.8
  const a1 = Math.PI * 2.2
  const at = pct => a0 + ((a1 - a0) * pct) / 100
  const thresholds = [
    { at: 80, color: t.warning },
    { at: 90, color: t.critical },
  ]

  return (
    <Panel title="Memory used" scope="of 64 GiB" span={3}>
      <svg viewBox={`0 0 ${size} 200`} style={{ width: "100%", height: 180 }}>
        <defs>
          <linearGradient id="le-gauge" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={t.series[1]} stopOpacity="0.55" />
            <stop offset="100%" stopColor={t.series[1]} />
          </linearGradient>
        </defs>
        <path
          d={arcPath(cx, cy, r, a0, a1)}
          stroke={t.border}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={arcPath(cx, cy, r, a0, at(value))}
          stroke="url(#le-gauge)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />
        {thresholds.map(threshold => {
          const [x0, y0] = polar(cx, cy, r + 9, at(threshold.at))
          const [x1, y1] = polar(cx, cy, r + 16, at(threshold.at))
          return (
            <line
              key={threshold.at}
              x1={x0}
              y1={y0}
              x2={x1}
              y2={y1}
              stroke={threshold.color}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )
        })}
        <path
          d={arcPath(cx, cy, r + 12.5, at(80), at(90))}
          stroke={t.warning}
          strokeOpacity="0.35"
          strokeWidth="2"
          fill="none"
        />
        <path
          d={arcPath(cx, cy, r + 12.5, at(90), a1)}
          stroke={t.critical}
          strokeOpacity="0.35"
          strokeWidth="2"
          fill="none"
        />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill={t.ink}
          fontSize="36"
          fontWeight="600"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {format(value, 1)}
          <tspan fill={t.muted} fontSize="15" fontWeight="400" dx="4">
            %
          </tspan>
        </text>
        <foreignObject x={cx - 52} y={cy + 8} width="104" height="26">
          <Sparkline
            values={values}
            color={t.series[1]}
            width={104}
            height={26}
            id="le-gauge-spark"
          />
        </foreignObject>
        <text
          x={polar(cx, cy, r, a0)[0]}
          y={cy + 72}
          textAnchor="middle"
          fill={t.muted}
          fontSize="11"
        >
          0
        </text>
        <text
          x={polar(cx, cy, r, a1)[0]}
          y={cy + 72}
          textAnchor="middle"
          fill={t.muted}
          fontSize="11"
        >
          100
        </text>
      </svg>
    </Panel>
  )
}

const LiveTag = ({ x, y, color, text }) => (
  <g>
    <rect x={x} y={y - 9} width="50" height="18" rx="3" fill={t.border} />
    <rect x={x} y={y - 9} width="2" height="18" fill={color} />
    <text
      x={x + 7}
      y={y + 4}
      fill={t.ink}
      fontSize="11"
      fontWeight="600"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {text}
    </text>
  </g>
)

const LiveDot = ({ x, y, color }) => (
  <g>
    <circle cx={x} cy={y} r="8" fill={color} opacity="0.22" />
    <circle
      cx={x}
      cy={y}
      r="3.5"
      fill={color}
      style={{ filter: `drop-shadow(0 0 5px ${color})` }}
    />
  </g>
)

const TimeSeries = ({ series, min, max, unit, threshold, height = 240, id }) => {
  const width = 820
  const gutter = 58
  const scales = makeScales({ width, height, min, max, pad: [8, gutter, 22, 44] })
  const { plot } = scales
  const ticks = niceTicks(min, max, 4)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height }}>
      <defs>
        {series.map((s, index) => (
          <Gradient key={s.id} id={`${id}-${index}`} color={s.color} from={0.4} />
        ))}
      </defs>
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
            fill={t.muted}
            fontSize="11"
          >
            {tick}
            {unit}
          </text>
        </g>
      ))}
      {threshold && (
        <g>
          <rect
            x={plot.left}
            y={plot.top}
            width={plot.right - plot.left}
            height={scales.y(threshold.value) - plot.top}
            fill={t.critical}
            opacity="0.06"
          />
          <line
            x1={plot.left}
            x2={plot.right}
            y1={scales.y(threshold.value)}
            y2={scales.y(threshold.value)}
            stroke={t.critical}
            strokeDasharray="4 4"
            strokeOpacity="0.7"
          />
          <text x={plot.left + 6} y={scales.y(threshold.value) - 6} fill={t.critical} fontSize="11">
            {threshold.label}
          </text>
        </g>
      )}
      {series.map((s, index) => (
        <g key={s.id}>
          {s.fill && <path d={areaPath(s.values, scales, min)} fill={`url(#${id}-${index})`} />}
          <path d={linePath(s.values, scales)} fill="none" stroke={s.color} strokeWidth="2" />
        </g>
      ))}
      {series.map(s => {
        const last = s.values[s.values.length - 1]
        return (
          <LiveDot
            key={s.id}
            x={scales.x(s.values.length - 1)}
            y={scales.y(last)}
            color={s.color}
          />
        )
      })}
      {series.map(s => {
        const last = s.values[s.values.length - 1]
        return (
          <LiveTag
            key={s.id}
            x={plot.right + 6}
            y={scales.y(last)}
            color={s.color}
            text={format(last, s.digits ?? 1)}
          />
        )
      })}
      {timeLabels.map((label, index) => (
        <text
          key={label}
          x={plot.left + ((plot.right - plot.left) * (index + 0.5)) / timeLabels.length}
          y={height - 4}
          textAnchor="middle"
          fill={t.muted}
          fontSize="11"
        >
          {label}
        </text>
      ))}
    </svg>
  )
}

const LegendTable = ({ series, unit }) => (
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 12,
      fontVariantNumeric: "tabular-nums",
    }}
  >
    <thead>
      <tr style={{ color: t.muted, textAlign: "right" }}>
        <th style={{ textAlign: "left", fontWeight: 400, padding: "4px 0" }}>Device</th>
        {["Last", "Mean", "Max"].map(label => (
          <th key={label} style={{ fontWeight: 400, padding: "4px 0 4px 16px" }}>
            {label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {series.map(s => {
        const { last, mean, max } = stats(s.values)
        return (
          <tr
            key={s.id}
            style={{ borderTop: `1px solid ${t.border}`, color: t.ink, textAlign: "right" }}
          >
            <td style={{ textAlign: "left", padding: "6px 0" }}>
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 3,
                  borderRadius: 2,
                  background: s.color,
                  marginRight: 8,
                  verticalAlign: "middle",
                }}
              />
              {s.id}
            </td>
            <td style={{ padding: "6px 0 6px 16px", fontWeight: 600 }}>
              {format(last, 0)} {unit}
            </td>
            <td style={{ padding: "6px 0 6px 16px", color: t.muted }}>{format(mean, 0)}</td>
            <td style={{ padding: "6px 0 6px 16px", color: t.muted }}>{format(max, 0)}</td>
          </tr>
        )
      })}
    </tbody>
  </table>
)

const stateColor = state => t[state]

const StateTimeline = ({ services }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
    {services.map(service => (
      <div key={service.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 64, fontSize: 12, color: t.ink }}>{service.id}</span>
        <div style={{ display: "flex", gap: 2, flex: 1, height: 22 }}>
          {service.segments.map(([state, share], index) => (
            <div
              key={index}
              title={state}
              style={{
                flex: share,
                background: stateColor(state),
                borderRadius: 3,
                opacity: state === "ok" ? 0.75 : 1,
              }}
            />
          ))}
        </div>
      </div>
    ))}
    <div
      style={{
        display: "flex",
        gap: 14,
        fontSize: 11,
        color: t.muted,
        marginTop: 4,
        paddingLeft: 74,
      }}
    >
      {["ok", "warning", "critical", "off"].map(state => (
        <span key={state} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: stateColor(state) }} />
          {state[0].toUpperCase() + state.slice(1)}
        </span>
      ))}
    </div>
  </div>
)

const BarGauge = ({ items }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    {items.map(item => {
      const color = item.used >= 90 ? t.critical : item.used >= 80 ? t.warning : t.series[1]
      return (
        <div
          key={item.id}
          style={{
            display: "grid",
            gridTemplateColumns: "150px 1fr 48px",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: t.ink,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.id}
          </span>
          <div style={{ height: 8, background: t.border, borderRadius: 4, position: "relative" }}>
            <div
              style={{
                width: `${item.used}%`,
                height: "100%",
                borderRadius: 4,
                background: `linear-gradient(90deg, ${color}66, ${color})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "80%",
                top: -3,
                bottom: -3,
                width: 1,
                background: t.muted,
                opacity: 0.5,
              }}
            />
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: item.used >= 80 ? color : t.ink,
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {item.used}%
          </span>
        </div>
      )
    })}
  </div>
)

export default () => {
  const cpu = [
    { id: "user", values: data.cpuUser, color: t.series[0], fill: true },
    { id: "system", values: data.cpuSystem, color: t.series[1], fill: true },
  ]
  const disks = data.disks.map((disk, index) => ({ ...disk, color: t.series[index], digits: 0 }))

  return (
    <div
      style={{
        background: t.ground,
        padding: 24,
        fontFamily: t.font,
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gap: 12,
      }}
    >
      <Stat
        title="CPU"
        scope="all cores"
        values={data.cpuUser.map((v, i) => v + data.cpuSystem[i])}
        unit="%"
        digits={1}
        color={t.series[0]}
        id="le-s1"
      />
      <Stat
        title="Load"
        scope="1 min"
        values={data.load}
        unit=""
        digits={2}
        color={t.series[2]}
        id="le-s2"
      />
      <Stat
        title="Network in"
        scope="eth0"
        values={data.netIn}
        unit="Gbit/s"
        digits={2}
        color={t.series[3]}
        id="le-s3"
      />
      <Gauge value={stats(data.memory).last} values={data.memory} />
      <Panel title="CPU utilization" scope="averaged over 32 cores" span={8}>
        <TimeSeries
          series={cpu}
          min={0}
          max={100}
          unit="%"
          threshold={{ value: 85, label: "Critical above 85%" }}
          id="le-cpu"
        />
      </Panel>
      <Panel title="Service health" scope="last 30 minutes" span={4}>
        <StateTimeline services={data.services} />
      </Panel>
      <Panel title="Disk I/O" scope="reads per device" span={7}>
        <TimeSeries series={disks} min={0} max={700} unit="" height={180} id="le-disk" />
        <LegendTable series={disks} unit="KiB/s" />
      </Panel>
      <Panel title="Filesystem usage" scope="warning at 80%" span={5}>
        <BarGauge items={data.filesystems} />
      </Panel>
    </div>
  )
}
