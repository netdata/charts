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
  points,
  stats,
  timeLabels,
  wave,
} from "./primitives"

const t = {
  ground: "#090C0C",
  panel: "#131717",
  grid: "#1F2525",
  ink: "#EDF1F1",
  muted: "#7C8C96",
  series: ["#1FA35E", "#3F84E5", "#E0692E", "#9085E9"],
  ok: "#1FA35E",
  warning: "#E0A526",
  critical: "#E5484D",
  off: "#3A4444",
  heat: ["#10302A", "#145F4A", "#1C8C5E", "#8DBB3C", "#E0A526", "#E5484D"],
  font: "'IBM Plex Sans', system-ui, sans-serif",
  numerals: "'IBM Plex Sans Condensed', 'IBM Plex Sans', system-ui, sans-serif",
}

const Panel = ({ span, title, status = "ok", note, children, pad = 16 }) => (
  <section
    style={{
      gridColumn: `span ${span}`,
      background: t.panel,
      borderRadius: 12,
      padding: pad,
      paddingTop: pad + 2,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      minWidth: 0,
      position: "relative",
      overflow: "hidden",
      boxShadow: `inset 0 3px 0 ${t[status]}`,
    }}
  >
    <header
      style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}
    >
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500, color: t.ink }}>{title}</h3>
      {note && (
        <span style={{ fontSize: 12, color: status === "ok" ? t.muted : t[status] }}>{note}</span>
      )}
    </header>
    {children}
  </section>
)

const Big = ({ value, unit, color = t.ink, size = 40 }) => (
  <span style={{ display: "inline-flex", alignItems: "baseline", gap: 5 }}>
    <span
      style={{
        fontFamily: t.numerals,
        fontSize: size,
        fontWeight: 600,
        color,
        lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </span>
    <span style={{ fontSize: size * 0.36, color: t.muted }}>{unit}</span>
  </span>
)

const Stat = ({ title, values, unit, digits, color, id, status, note }) => (
  <Panel span={3} title={title} status={status} note={note}>
    <Big
      value={format(stats(values).last, digits)}
      unit={unit}
      color={status === "ok" ? t.ink : t[status]}
    />
    <div style={{ margin: "0 -16px -16px", height: 40 }}>
      <Sparkline
        values={values}
        color={status === "ok" ? color : t[status]}
        height={40}
        width={300}
        id={id}
      />
    </div>
  </Panel>
)

const SegmentGauge = ({ value }) => {
  const segments = 28
  const cx = 110
  const cy = 112
  const r = 84
  const a0 = Math.PI * 0.8
  const a1 = Math.PI * 2.2
  const span = (a1 - a0) / segments
  const colorAt = pct => (pct >= 90 ? t.critical : pct >= 80 ? t.warning : t.series[1])

  return (
    <Panel span={3} title="Memory used" note="of 64 GiB">
      <svg viewBox="0 0 220 190" style={{ width: "100%", height: 170 }}>
        {Array.from({ length: segments }, (_, index) => {
          const pct = ((index + 0.5) / segments) * 100
          const on = pct <= value
          return (
            <path
              key={index}
              d={arcPath(
                cx,
                cy,
                r,
                a0 + index * span + span * 0.12,
                a0 + (index + 1) * span - span * 0.12
              )}
              stroke={on ? colorAt(pct) : t.grid}
              strokeOpacity={on ? 1 : pct >= 80 ? 0.9 : 1}
              strokeWidth="16"
              fill="none"
              style={on ? { filter: `drop-shadow(0 0 3px ${colorAt(pct)}88)` } : undefined}
            />
          )
        })}
        {[80, 90].map(pct => {
          const index = Math.floor((pct / 100) * segments)
          return (
            <path
              key={pct}
              d={arcPath(cx, cy, r + 13, a0 + index * span, a0 + (index + 1) * span)}
              stroke={pct === 90 ? t.critical : t.warning}
              strokeWidth="2"
              fill="none"
            />
          )
        })}
        <text
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          fill={t.ink}
          fontSize="40"
          fontWeight="600"
          fontFamily={t.numerals}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {format(value, 1)}
          <tspan fontSize="16" fill={t.muted} dx="3">
            %
          </tspan>
        </text>
        <text x={cx} y={cy + 30} textAnchor="middle" fill={t.muted} fontSize="12">
          45.6 GiB used
        </text>
      </svg>
    </Panel>
  )
}

const cores = Array.from({ length: 16 }, (_, core) =>
  wave({
    center: 45 + (core % 5) * 6,
    amplitude: 22,
    cycles: 2 + (core % 3),
    phase: core * 0.8,
    seed: core + 20,
    noise: 0.3,
  }).map((v, i) => (i >= 92 ? v + 30 : v))
)

const heatColor = value =>
  t.heat[Math.max(0, Math.min(t.heat.length - 1, Math.floor((value / 100) * t.heat.length)))]

const CpuField = ({ series }) => {
  const width = 820
  const height = 170
  const scales = makeScales({ width, height, min: 0, max: 100, pad: [6, 8, 4, 40] })
  const { plot } = scales
  const cell = (plot.right - plot.left) / points

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height }}>
        <defs>
          {series.map((s, index) => (
            <Gradient key={s.id} id={`sg-cpu-${index}`} color={s.color} from={0.55} to={0.05} />
          ))}
        </defs>
        {niceTicks(0, 100, 4).map(tick => (
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
              {tick}%
            </text>
          </g>
        ))}
        <line
          x1={plot.left}
          x2={plot.right}
          y1={scales.y(85)}
          y2={scales.y(85)}
          stroke={t.critical}
          strokeDasharray="2 3"
        />
        {series.map((s, index) => (
          <g key={s.id}>
            <path d={areaPath(s.values, scales, 0)} fill={`url(#sg-cpu-${index})`} />
            <path d={linePath(s.values, scales)} fill="none" stroke={s.color} strokeWidth="2" />
          </g>
        ))}
      </svg>
      <svg
        viewBox={`0 0 ${width} ${cores.length * 5 + 22}`}
        style={{ width: "100%", height: cores.length * 5 + 22 }}
      >
        <text x={plot.left - 8} y={10} textAnchor="end" fill={t.muted} fontSize="10">
          core 0
        </text>
        <text x={plot.left - 8} y={cores.length * 5} textAnchor="end" fill={t.muted} fontSize="10">
          15
        </text>
        {cores.map((values, row) =>
          values.map((value, column) => (
            <rect
              key={`${row}-${column}`}
              x={plot.left + column * cell}
              y={row * 5}
              width={cell + 0.3}
              height="4.4"
              fill={heatColor(value)}
            />
          ))
        )}
        {timeLabels.map((label, index) => (
          <text
            key={label}
            x={plot.left + ((plot.right - plot.left) * (index + 0.5)) / timeLabels.length}
            y={cores.length * 5 + 16}
            textAnchor="middle"
            fill={t.muted}
            fontSize="11"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  )
}

const StateField = ({ services }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
    {services.map(service => (
      <div
        key={service.id}
        style={{
          display: "flex",
          flex: 1,
          minHeight: 38,
          borderRadius: 6,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {service.segments.map(([state, share], index) => (
          <div
            key={index}
            style={{
              flex: share,
              background: state === "ok" ? `${t.ok}2E` : state === "off" ? t.off : t[state],
            }}
          />
        ))}
        <span
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 13,
            fontWeight: 500,
            color: t.ink,
            textShadow: "0 1px 2px #0008",
          }}
        >
          {service.id}
        </span>
      </div>
    ))}
  </div>
)

const Ridges = ({ series }) => {
  const width = 820
  const rowHeight = 46
  const height = series.length * rowHeight + 30
  const max = Math.max(...series.flatMap(s => s.values))

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height }}>
      <defs>
        {series.map((s, index) => (
          <Gradient key={s.id} id={`sg-ridge-${index}`} color={s.color} from={0.6} to={0.08} />
        ))}
      </defs>
      {series.map((s, index) => {
        const top = index * rowHeight
        const scales = makeScales({
          width,
          height: top + rowHeight + 18,
          min: 0,
          max,
          pad: [top - 10, 70, 0, 80],
        })
        const last = s.values[s.values.length - 1]
        return (
          <g key={s.id}>
            <path d={areaPath(s.values, scales, 0)} fill={`url(#sg-ridge-${index})`} />
            <path d={linePath(s.values, scales)} fill="none" stroke={s.color} strokeWidth="1.6" />
            <text x={0} y={top + rowHeight + 10} fill={t.ink} fontSize="12">
              {s.id}
            </text>
            <text
              x={width}
              y={top + rowHeight + 10}
              textAnchor="end"
              fill={t.ink}
              fontSize="13"
              fontFamily={t.numerals}
              fontWeight="600"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {format(last, 0)}
              <tspan fill={t.muted} fontSize="10" fontWeight="400" dx="3">
                KiB/s
              </tspan>
            </text>
          </g>
        )
      })}
    </svg>
  )
}

const Tiles = ({ items }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gridAutoRows: 64,
      gap: 4,
      flex: 1,
    }}
  >
    {items.map((item, index) => {
      const color = item.used >= 90 ? t.critical : item.used >= 80 ? t.warning : t.series[1]
      return (
        <div
          key={item.id}
          style={{
            gridColumn: index === 0 ? "span 3" : index === 1 ? "span 3" : "span 2",
            borderRadius: 6,
            padding: "8px 10px",
            position: "relative",
            overflow: "hidden",
            background: t.grid,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: `${item.used}%`,
              background: `linear-gradient(90deg, ${color}22, ${color}55)`,
              borderRight: `2px solid ${color}`,
            }}
          />
          <span
            style={{
              position: "relative",
              fontSize: 11,
              color: t.ink,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.id}
          </span>
          <span
            style={{
              position: "relative",
              fontFamily: t.numerals,
              fontSize: 22,
              fontWeight: 600,
              color: item.used >= 80 ? color : t.ink,
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
  const cpuTotal = data.cpuUser.map((v, i) => v + data.cpuSystem[i])
  const cpu = [
    { id: "user", values: data.cpuUser, color: t.series[0] },
    { id: "system", values: data.cpuSystem, color: t.series[1] },
  ]
  const disks = data.disks.map((disk, index) => ({ ...disk, color: t.series[index] }))

  return (
    <div
      style={{
        background: t.ground,
        padding: 24,
        fontFamily: t.font,
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gap: 10,
      }}
    >
      <Stat
        title="CPU"
        values={cpuTotal}
        unit="%"
        digits={1}
        color={t.series[0]}
        id="sg-s1"
        status="warning"
        note="above 70% for 4 min"
      />
      <Stat
        title="Load, 1 min"
        values={data.load}
        unit=""
        digits={2}
        color={t.series[2]}
        id="sg-s2"
        status="ok"
        note="8 cores"
      />
      <Stat
        title="Network in"
        values={data.netIn}
        unit="Gbit/s"
        digits={2}
        color={t.series[3]}
        id="sg-s3"
        status="ok"
        note="eth0"
      />
      <SegmentGauge value={stats(data.memory).last} />
      <Panel span={8} title="CPU utilization" status="warning" note="heat strip: per-core load">
        <CpuField series={cpu} />
      </Panel>
      <Panel
        span={4}
        title="Service health"
        status="critical"
        note="postgres was critical for 3 min"
      >
        <StateField services={data.services} />
      </Panel>
      <Panel span={7} title="Disk reads per device">
        <Ridges series={disks} />
      </Panel>
      <Panel span={5} title="Filesystem usage" status="critical" note="/boot is 94% full">
        <Tiles items={data.filesystems} />
      </Panel>
    </div>
  )
}
