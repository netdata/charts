import React, { useState } from "react"
import { Sparkline, arcPath, format, polar, stats, wave } from "./primitives"
import { themes, font } from "./chartCard"

const numerals = "'IBM Plex Sans Condensed', 'IBM Plex Sans', system-ui, sans-serif"

// one hue, light to dark: magnitude, never identity
const sequential = {
  light: ["#EAF1FC", "#C9DCF7", "#9CC0F0", "#6A9EE6", "#3D7AD6", "#2358B0", "#173E80"],
  dark: ["#172230", "#1B3350", "#224B78", "#2C66A3", "#3F84D4", "#6FA6EE", "#A9CBF8"],
}

const tone = (t, value, { warning, critical } = {}) =>
  critical != null && value >= critical
    ? t.critical
    : warning != null && value >= warning
      ? t.warning
      : null

export const Card = ({ t, title, scope, attention, span = 1, children, pad = 16 }) => (
  <section
    style={{
      gridColumn: `span ${span}`,
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 12,
      padding: pad,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      minWidth: 0,
      fontFamily: font,
      position: "relative",
    }}
  >
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: t.ink,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </h3>
        {scope && <div style={{ fontSize: 12, color: t.faint, marginTop: 2 }}>{scope}</div>}
      </div>
      {attention}
    </header>
    {children}
  </section>
)

export const Pill = ({ t, color, children }) => (
  <span
    style={{
      fontSize: 11,
      fontWeight: 600,
      color: t.panel,
      background: color,
      borderRadius: 999,
      padding: "2px 8px",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
)

const Quiet = ({ t, children = "Within thresholds" }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12,
      color: t.faint,
      whiteSpace: "nowrap",
    }}
  >
    <span style={{ width: 7, height: 7, borderRadius: 999, background: t.series[0] }} />
    {children}
  </span>
)

const Big = ({ t, value, unit, color, size = 40 }) => (
  <span style={{ display: "inline-flex", alignItems: "baseline", gap: 5 }}>
    <span
      style={{
        fontFamily: numerals,
        fontSize: size,
        fontWeight: 600,
        lineHeight: 1,
        color: color || t.ink,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.01em",
      }}
    >
      {value}
    </span>
    {unit && (
      <span style={{ fontFamily: numerals, fontSize: Math.max(12, size * 0.36), color: t.muted }}>
        {unit}
      </span>
    )}
  </span>
)

export const Gauge = ({ t, title, scope, values, unit, thresholds, max = 100, id, span = 1 }) => {
  const value = values[values.length - 1]
  const cx = 120
  const cy = 118
  const r = 92
  const a0 = Math.PI * 0.8
  const a1 = Math.PI * 2.2
  const at = v => a0 + ((a1 - a0) * Math.min(v, max)) / max
  const hot = tone(t, value, thresholds)
  const color = hot || t.series[1]

  return (
    <Card
      t={t}
      span={span}
      title={title}
      scope={scope}
      attention={
        hot ? (
          <Pill t={t} color={hot}>
            {value >= thresholds.critical ? "Critical" : "Warning"}
          </Pill>
        ) : (
          <Quiet t={t} />
        )
      }
    >
      <svg viewBox="0 0 240 200" style={{ width: "100%", height: 190 }}>
        <defs>
          <linearGradient id={`${id}-arc`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <path
          d={arcPath(cx, cy, r, a0, a1)}
          stroke={t.grid}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={arcPath(cx, cy, r, a0, at(value))}
          stroke={`url(#${id}-arc)`}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={arcPath(cx, cy, r + 13, at(thresholds.warning), at(thresholds.critical))}
          stroke={t.warning}
          strokeWidth="3"
          fill="none"
        />
        <path
          d={arcPath(cx, cy, r + 13, at(thresholds.critical), a1)}
          stroke={t.critical}
          strokeWidth="3"
          fill="none"
        />
        {(() => {
          const [x, y] = polar(cx, cy, r, at(value))
          return <circle cx={x} cy={y} r="7" fill={t.panel} stroke={color} strokeWidth="3" />
        })()}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fill={hot || t.ink}
          fontFamily={numerals}
          fontSize="44"
          fontWeight="600"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {format(value, 1)}
          <tspan fontSize="16" fill={t.muted} dx="3">
            {unit}
          </tspan>
        </text>
        <foreignObject x={cx - 56} y={cy + 12} width="112" height="28">
          <Sparkline values={values} color={color} width={112} height={28} id={`${id}-spark`} />
        </foreignObject>
        <text
          x={polar(cx, cy, r, a0)[0]}
          y={cy + 82}
          textAnchor="middle"
          fill={t.faint}
          fontSize="11"
        >
          0
        </text>
        <text
          x={polar(cx, cy, r, a1)[0]}
          y={cy + 82}
          textAnchor="middle"
          fill={t.faint}
          fontSize="11"
        >
          {max}
        </text>
      </svg>
    </Card>
  )
}

export const Stat = ({
  t,
  title,
  scope,
  values,
  unit,
  digits = 1,
  thresholds,
  color,
  id,
  span = 1,
}) => {
  const { last, mean } = stats(values)
  const hot = thresholds && tone(t, last, thresholds)
  const delta = last - mean
  return (
    <Card
      t={t}
      span={span}
      title={title}
      scope={scope}
      attention={
        hot ? (
          <Pill t={t} color={hot}>
            Warning
          </Pill>
        ) : null
      }
    >
      <div
        style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}
      >
        <Big t={t} value={format(last, digits)} unit={unit} color={hot} size={44} />
        <span
          style={{
            fontSize: 12,
            color: hot ? hot : t.faint,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          {`${delta >= 0 ? "+" : "−"}${format(Math.abs(delta), digits)} vs mean`}
        </span>
      </div>
      <div
        style={{
          margin: "0 -16px -16px",
          height: 46,
          overflow: "hidden",
          borderRadius: "0 0 12px 12px",
        }}
      >
        <Sparkline values={values} color={hot || color} width={300} height={46} id={id} />
      </div>
    </Card>
  )
}

export const Rings = ({ t, title, scope, items, span = 1 }) => (
  <Card
    t={t}
    span={span}
    title={title}
    scope={scope}
    attention={
      <Quiet
        t={t}
      >{`${items.filter(i => i.value >= 80).length} of ${items.length} above 80%`}</Quiet>
    }
  >
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 8 }}>
      {items.map(item => {
        const hot = tone(t, item.value, { warning: 80, critical: 95 })
        const color = hot || t.series[0]
        const r = 30
        const c = 2 * Math.PI * r
        return (
          <div
            key={item.id}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
          >
            <svg viewBox="0 0 80 80" style={{ width: "100%", maxWidth: 76, height: "auto" }}>
              <circle cx="40" cy="40" r={r} stroke={t.grid} strokeWidth="7" fill="none" />
              <circle
                cx="40"
                cy="40"
                r={r}
                stroke={color}
                strokeWidth="7"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(c * item.value) / 100} ${c}`}
                transform="rotate(-90 40 40)"
              />
              <text
                x="40"
                y="45"
                textAnchor="middle"
                fill={hot || t.ink}
                fontFamily={numerals}
                fontSize="18"
                fontWeight="600"
              >
                {Math.round(item.value)}
              </text>
            </svg>
            <span style={{ fontSize: 11.5, color: t.muted }}>{item.id}</span>
          </div>
        )
      })}
    </div>
  </Card>
)

export const Donut = ({ t, title, scope, items, unit, span = 1 }) => {
  const [focus, setFocus] = useState(null)
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const cx = 90
  const cy = 90
  const r = 70
  const gap = 0.025
  let angle = -Math.PI / 2
  const arcs = items.map((item, index) => {
    const span = (item.value / total) * Math.PI * 2
    const arc = {
      ...item,
      color: t.series[index % t.series.length],
      a0: angle + gap,
      a1: angle + span - gap,
    }
    angle += span
    return arc
  })
  const shown = focus ? arcs.find(a => a.id === focus) : null

  return (
    <Card t={t} span={span} title={title} scope={scope}>
      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
        <svg viewBox="0 0 180 180" style={{ width: 170, height: 170, flexShrink: 0 }}>
          {arcs.map(arc => (
            <path
              key={arc.id}
              d={arcPath(cx, cy, r, arc.a0, arc.a1)}
              stroke={arc.color}
              strokeWidth={focus === arc.id ? 24 : 20}
              fill="none"
              opacity={focus && focus !== arc.id ? 0.25 : 1}
              onMouseEnter={() => setFocus(arc.id)}
              onMouseLeave={() => setFocus(null)}
              style={{ transition: "opacity 120ms, stroke-width 120ms", cursor: "pointer" }}
            />
          ))}
          <text
            x={cx}
            y={cy + 2}
            textAnchor="middle"
            fill={t.ink}
            fontFamily={numerals}
            fontSize="28"
            fontWeight="600"
          >
            {format(shown ? shown.value : total, 0)}
          </text>
          <text x={cx} y={cy + 20} textAnchor="middle" fill={t.muted} fontSize="11">
            {shown ? `${shown.id}, ${format((shown.value / total) * 100, 0)}%` : `${unit} total`}
          </text>
        </svg>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
          {arcs.map(arc => (
            <div
              key={arc.id}
              onMouseEnter={() => setFocus(arc.id)}
              onMouseLeave={() => setFocus(null)}
              style={{
                display: "grid",
                gridTemplateColumns: "10px 1fr auto 38px",
                gap: 8,
                alignItems: "center",
                fontSize: 12,
                opacity: focus && focus !== arc.id ? 0.4 : 1,
                cursor: "pointer",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 2, background: arc.color }} />
              <span
                style={{
                  color: t.ink,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {arc.id}
              </span>
              <span style={{ color: t.ink, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                {format(arc.value, 0)}
              </span>
              <span
                style={{ color: t.faint, textAlign: "right", fontVariantNumeric: "tabular-nums" }}
              >
                {format((arc.value / total) * 100, 0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export const RankedBars = ({ t, title, scope, items, unit, max, span = 1 }) => {
  const sorted = [...items].sort((a, b) => b.value - a.value)
  const top = max || sorted[0].value
  return (
    <Card t={t} span={span} title={title} scope={scope}>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {sorted.map((item, index) => (
          <div
            key={item.id}
            style={{
              display: "grid",
              gridTemplateColumns: "118px 1fr 64px",
              gap: 10,
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: t.ink,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.id}
            </span>
            <div style={{ height: 10, borderRadius: 3, background: t.grid, overflow: "hidden" }}>
              <div
                style={{
                  width: `${(item.value / top) * 100}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: index === 0 ? t.series[1] : `${t.series[1]}99`,
                }}
              />
            </div>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: t.ink,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {format(item.value, 0)}
              <span style={{ color: t.faint, fontWeight: 400 }}>{` ${unit}`}</span>
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

const tableRows = [
  {
    id: "api-gateway",
    node: "prod-edge-1",
    status: "critical",
    cpu: 93.4,
    mem: 71,
    rps: wave({ center: 820, amplitude: 180, cycles: 3, seed: 31 }),
  },
  {
    id: "postgres",
    node: "prod-db-1",
    status: "warning",
    cpu: 78.2,
    mem: 88,
    rps: wave({ center: 410, amplitude: 90, cycles: 2, seed: 32 }),
  },
  {
    id: "redis",
    node: "prod-cache-1",
    status: "ok",
    cpu: 22.6,
    mem: 43,
    rps: wave({ center: 1600, amplitude: 300, cycles: 4, seed: 33 }),
  },
  {
    id: "worker",
    node: "prod-jobs-2",
    status: "ok",
    cpu: 41.0,
    mem: 52,
    rps: wave({ center: 120, amplitude: 40, cycles: 2.5, seed: 34 }),
  },
  {
    id: "nginx",
    node: "prod-edge-2",
    status: "ok",
    cpu: 18.9,
    mem: 21,
    rps: wave({ center: 950, amplitude: 150, cycles: 3.4, seed: 35 }),
  },
]

export const DataTable = ({ t, title, scope, span = 1 }) => {
  const statusColor = { critical: t.critical, warning: t.warning, ok: t.series[0] }
  const cell = {
    padding: "8px 10px",
    borderTop: `1px solid ${t.grid}`,
    fontSize: 12.5,
    color: t.ink,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  }
  const head = {
    padding: "6px 10px",
    fontSize: 11.5,
    color: t.faint,
    fontWeight: 400,
    textAlign: "left",
    whiteSpace: "nowrap",
  }
  const Meter = ({ value, warning }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 70, height: 6, borderRadius: 3, background: t.grid }}>
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            borderRadius: 3,
            background: value >= warning ? t.warning : t.series[1],
          }}
        />
      </div>
      <span style={{ fontWeight: 600, color: value >= warning ? t.warning : t.ink }}>
        {format(value, 1)}%
      </span>
    </div>
  )
  return (
    <Card
      t={t}
      span={span}
      title={title}
      scope={scope}
      attention={
        <Pill t={t} color={t.critical}>
          1 critical, 1 warning
        </Pill>
      }
      pad={14}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={head}>Service</th>
            <th style={head}>Node</th>
            <th style={{ ...head, color: t.ink }}>CPU ↓</th>
            <th style={head}>Memory</th>
            <th style={head}>Requests per second</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map(row => (
            <tr key={row.id}>
              <td style={cell}>
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: statusColor[row.status],
                    marginRight: 8,
                  }}
                />
                {row.id}
              </td>
              <td style={{ ...cell, color: t.muted }}>{row.node}</td>
              <td style={cell}>
                <Meter value={row.cpu} warning={80} />
              </td>
              <td style={cell}>
                <Meter value={row.mem} warning={85} />
              </td>
              <td style={cell}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 110 }}>
                    <Sparkline
                      values={row.rps}
                      color={t.series[3]}
                      width={110}
                      height={22}
                      fill={false}
                      id={`tbl-${row.id}`}
                    />
                  </div>
                  <span style={{ fontWeight: 600 }}>{format(stats(row.rps).last, 0)}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

export const HeatGrid = ({ t, theme, title, scope, span = 1 }) => {
  const ramp = sequential[theme]
  const groups = ["prod-edge", "prod-db", "prod-jobs", "staging"].map((group, g) => ({
    group,
    boxes: Array.from({ length: g === 0 ? 24 : g === 3 ? 10 : 16 }, (_, i) => {
      const noise = Math.sin((i + 1) * (g + 3) * 12.9898) * 43758.5453
      return Math.min(
        100,
        Math.max(2, 30 + (noise - Math.floor(noise)) * 55 + (g === 1 && i < 3 ? 40 : 0))
      )
    }),
  }))
  const [hover, setHover] = useState(null)
  return (
    <Card
      t={t}
      span={span}
      title={title}
      scope={scope}
      attention={(() => {
        const hot = groups.reduce((sum, g) => sum + g.boxes.filter(v => v >= 90).length, 0)
        return hot ? (
          <Pill t={t} color={t.critical}>{`${hot} ${hot === 1 ? "node" : "nodes"} above 90%`}</Pill>
        ) : (
          <Quiet t={t} />
        )
      })()}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {groups.map(({ group, boxes }) => (
          <div
            key={group}
            style={{
              display: "grid",
              gridTemplateColumns: "76px 1fr",
              gap: 10,
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 11.5, color: t.muted }}>{group}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {boxes.map((value, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setHover({ group, i, value })}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    background:
                      value >= 90
                        ? t.critical
                        : ramp[Math.min(ramp.length - 1, Math.floor((value / 100) * ramp.length))],
                    outline:
                      hover && hover.group === group && hover.i === i
                        ? `2px solid ${t.ink}`
                        : "none",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            color: t.faint,
            paddingLeft: 86,
          }}
        >
          <span>0%</span>
          <div style={{ display: "flex", borderRadius: 3, overflow: "hidden" }}>
            {ramp.map(color => (
              <span key={color} style={{ width: 18, height: 8, background: color }} />
            ))}
          </div>
          <span>100%</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: t.critical }} />
            above 90%
          </span>
          {hover && (
            <span
              style={{ marginLeft: "auto", color: t.ink, fontWeight: 600 }}
            >{`${hover.group}-${hover.i + 1}: ${format(hover.value, 0)}%`}</span>
          )}
        </div>
      </div>
    </Card>
  )
}

export const Heatmap = ({ t, theme, title, scope, span = 1 }) => {
  const ramp = sequential[theme]
  const buckets = ["1s", "500ms", "250ms", "100ms", "50ms", "25ms", "10ms", "5ms"]
  const columns = 60
  return (
    <Card
      t={t}
      span={span}
      title={title}
      scope={scope}
      attention={
        <Pill t={t} color={t.warning}>
          p99 up 2.4×
        </Pill>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 8 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            fontSize: 10.5,
            color: t.faint,
            textAlign: "right",
            padding: "2px 0",
          }}
        >
          {buckets.map(b => (
            <span key={b}>{b}</span>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gridTemplateRows: `repeat(${buckets.length}, 16px)`,
            gap: 1.5,
          }}
        >
          {buckets.flatMap((bucket, row) =>
            Array.from({ length: columns }, (_, col) => {
              const shift = col > 42 ? 2 : 0
              const center = 5.2 - shift
              const density =
                Math.max(0, 1 - Math.abs(row - center) / 2.6) *
                (0.75 + 0.25 * Math.sin(col * 0.7 + row))
              return (
                <span
                  key={`${bucket}-${col}`}
                  style={{
                    background:
                      density < 0.05
                        ? "transparent"
                        : ramp[Math.min(ramp.length - 1, Math.floor(density * ramp.length))],
                    borderRadius: 2,
                  }}
                />
              )
            })
          )}
        </div>
      </div>
    </Card>
  )
}

export const TooltipMock = ({ t }) => (
  <div
    style={{
      width: 250,
      background: t.hoverBg,
      boxShadow: t.hoverShadow,
      borderRadius: 10,
      padding: "10px 12px",
      fontFamily: font,
      fontSize: 12,
    }}
  >
    <div
      style={{ display: "flex", justifyContent: "space-between", color: t.muted, marginBottom: 8 }}
    >
      <span style={{ fontVariantNumeric: "tabular-nums" }}>14:42:15</span>
      <span>every 5s</span>
    </div>
    {[
      ["load15", "#E0621F", "23.84", null],
      ["load5", "#2A70D6", "14.32", "12%"],
      ["load1", "#00914A", "9.57", null],
    ].map(([name, color, value, anomaly]) => (
      <div
        key={name}
        style={{
          display: "grid",
          gridTemplateColumns: "10px 1fr auto",
          gap: 8,
          alignItems: "center",
          padding: "3px 0",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
        <span style={{ color: t.ink }}>
          {name}
          {anomaly && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 10.5,
                color: t.anomaly,
                background: `${t.anomaly}1F`,
                borderRadius: 4,
                padding: "1px 5px",
              }}
            >{`anomalous ${anomaly}`}</span>
          )}
        </span>
        <span style={{ color: t.ink, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </span>
      </div>
    ))}
    <div
      style={{
        marginTop: 8,
        paddingTop: 8,
        borderTop: `1px solid ${t.grid}`,
        display: "flex",
        gap: 8,
        alignItems: "center",
        color: t.muted,
      }}
    >
      <span
        style={{
          width: 0,
          height: 0,
          borderLeft: `6px solid ${t.muted}`,
          borderTop: "4px solid transparent",
          borderBottom: "4px solid transparent",
        }}
      />
      <span>Deploy v2.14 by ci-bot</span>
    </div>
  </div>
)

const nodes = [
  { id: "prod-edge-1", vol: 31, anomaly: 4, alerts: { critical: 1 } },
  { id: "prod-edge-2", vol: 24, anomaly: 0, alerts: {} },
  { id: "prod-db-1", vol: 19, anomaly: 12, alerts: { warning: 2 } },
  { id: "prod-cache-1", vol: 14, anomaly: 0, alerts: {} },
  { id: "prod-jobs-2", vol: 8, anomaly: 1, alerts: {} },
  { id: "staging-1", vol: 4, anomaly: 0, alerts: {} },
]

export const DropdownMock = ({ t }) => (
  <div
    style={{
      width: "100%",
      background: t.hoverBg,
      boxShadow: t.hoverShadow,
      borderRadius: 12,
      fontFamily: font,
      overflow: "hidden",
    }}
  >
    <div style={{ padding: 10, borderBottom: `1px solid ${t.grid}` }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: `1px solid ${t.border}`,
          borderRadius: 8,
          padding: "6px 10px",
          fontSize: 12.5,
          color: t.faint,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <circle cx="7" cy="7" r="4.5" />
          <path d="M10.5 10.5 14 14" />
        </svg>
        Search 6 nodes
      </div>
    </div>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "18px 1fr 90px 58px 56px",
        gap: 8,
        padding: "8px 12px 4px",
        fontSize: 11,
        color: t.faint,
      }}
    >
      <span />
      <span>Node</span>
      <span>Share of volume ↓</span>
      <span style={{ textAlign: "right" }}>Anomaly</span>
      <span style={{ textAlign: "right" }}>Alerts</span>
    </div>
    {nodes.map((node, index) => (
      <div
        key={node.id}
        style={{
          display: "grid",
          gridTemplateColumns: "18px 1fr 90px 58px 56px",
          gap: 8,
          alignItems: "center",
          padding: "6px 12px",
          fontSize: 12.5,
          color: t.ink,
          background: index === 2 ? t.chip : "transparent",
        }}
      >
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: 4,
            border: `1.5px solid ${index < 4 ? t.series[1] : t.border}`,
            background: index < 4 ? t.series[1] : "transparent",
            color: t.panel,
            fontSize: 10,
            display: "grid",
            placeItems: "center",
          }}
        >
          {index < 4 ? "✓" : ""}
        </span>
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {node.id}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ flex: 1, height: 5, borderRadius: 3, background: t.grid }}>
            <span
              style={{
                display: "block",
                width: `${(node.vol / 31) * 100}%`,
                height: "100%",
                borderRadius: 3,
                background: t.series[1],
              }}
            />
          </span>
          <span
            style={{
              fontSize: 11.5,
              color: t.muted,
              width: 28,
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {node.vol}%
          </span>
        </span>
        <span
          style={{
            textAlign: "right",
            fontSize: 12,
            color: node.anomaly ? t.anomaly : t.faint,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {node.anomaly ? `${node.anomaly}%` : "0"}
        </span>
        <span style={{ textAlign: "right" }}>
          {node.alerts.critical && (
            <Pill t={t} color={t.critical}>
              {node.alerts.critical}
            </Pill>
          )}
          {node.alerts.warning && (
            <Pill t={t} color={t.warning}>
              {node.alerts.warning}
            </Pill>
          )}
        </span>
      </div>
    ))}
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 12px",
        borderTop: `1px solid ${t.grid}`,
        fontSize: 12,
        color: t.muted,
      }}
    >
      <span>4 of 6 selected</span>
      <span style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          style={{
            border: 0,
            background: "transparent",
            color: t.muted,
            fontFamily: font,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Clear
        </button>
        <button
          type="button"
          style={{
            border: 0,
            borderRadius: 7,
            background: t.ink,
            color: t.panel,
            fontFamily: font,
            fontSize: 12,
            padding: "5px 12px",
            cursor: "pointer",
          }}
        >
          Apply
        </button>
      </span>
    </div>
  </div>
)

export const Family = ({ theme = "light" }) => {
  const t = themes[theme]
  return (
    <div
      style={{
        background: t.ground,
        minHeight: "100vh",
        padding: 28,
        boxSizing: "border-box",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        alignItems: "start",
        fontFamily: font,
      }}
    >
      <Gauge
        t={t}
        title="Memory used"
        scope="of 64 GiB"
        values={wave({ center: 84, amplitude: 4, cycles: 1.4, seed: 41, noise: 0.05 })}
        unit="%"
        thresholds={{ warning: 80, critical: 92 }}
        id="fam-g1"
      />
      <Gauge
        t={t}
        title="Swap used"
        scope="of 8 GiB"
        values={wave({ center: 23, amplitude: 3, cycles: 1.2, seed: 42, noise: 0.05 })}
        unit="%"
        thresholds={{ warning: 70, critical: 90 }}
        id="fam-g2"
      />
      <Stat
        t={t}
        title="Requests"
        scope="per second, all edges"
        values={wave({ center: 1840, amplitude: 260, cycles: 3, seed: 43 })}
        unit="req/s"
        digits={0}
        color={t.series[3]}
        id="fam-s1"
      />
      <Stat
        t={t}
        title="Error rate"
        scope="5xx, last 30 min"
        values={wave({ center: 2.4, amplitude: 1.2, cycles: 2, seed: 44 }).map((v, i) =>
          i > 96 ? v + 2.2 : v
        )}
        unit="%"
        digits={2}
        thresholds={{ warning: 3, critical: 6 }}
        color={t.series[2]}
        id="fam-s2"
      />
      <Rings
        t={t}
        span={2}
        title="CPU per core"
        scope="8 cores, last value"
        items={[92, 71, 64, 58, 47, 33, 29, 81].map((value, i) => ({ id: `cpu${i}`, value }))}
      />
      <Donut
        t={t}
        title="Traffic by protocol"
        scope="last 30 minutes"
        unit="GiB"
        items={[
          { id: "https", value: 412 },
          { id: "grpc", value: 188 },
          { id: "http", value: 96 },
          { id: "websocket", value: 54 },
          { id: "other", value: 21 },
        ]}
        span={2}
      />
      <RankedBars
        t={t}
        title="Top processes by CPU"
        scope="prod-edge-1"
        unit="%"
        max={100}
        items={[
          { id: "envoy", value: 64 },
          { id: "node", value: 41 },
          { id: "postgres", value: 27 },
          { id: "netdata", value: 3 },
          { id: "sshd", value: 1 },
        ]}
        span={2}
      />
      <HeatGrid t={t} theme={theme} title="Node CPU" scope="66 nodes by group" span={2} />
      <DataTable t={t} title="Services" scope="5 services on 5 nodes" span={3} />
      <Card t={t} title="Hover tooltip" scope="only what exists at that point" span={1}>
        <div style={{ display: "grid", placeItems: "center", padding: "8px 0" }}>
          <TooltipMock t={t} />
        </div>
      </Card>
      <Card t={t} title="Filter dropdown" span={2} scope="Nodes, with contribution and health">
        <DropdownMock t={t} />
      </Card>
      <Heatmap
        t={t}
        theme={theme}
        title="Request latency"
        scope="distribution, every 5s"
        span={2}
      />
    </div>
  )
}
