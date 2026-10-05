import React from "react"
import {
  Gradient,
  Sparkline,
  areaPath,
  dashboardData as data,
  format,
  linePath,
  makeScales,
  stats,
  timeLabels,
} from "./primitives"

const t = {
  ground: "#0E1212",
  panel: "#161B1B",
  raised: "#1D2323",
  grid: "#232A2A",
  ink: "#EEF2F2",
  muted: "#7F8E97",
  faint: "#56646C",
  series: ["#1FA35E", "#3F84E5", "#E0692E", "#9085E9"],
  ok: "#2A7F57",
  warning: "#E0A526",
  critical: "#E5484D",
  off: "#323B3B",
  font: "'IBM Plex Sans', system-ui, sans-serif",
  numerals: "'IBM Plex Sans Condensed', 'IBM Plex Sans', system-ui, sans-serif",
}

const Readout = ({ value, unit, size = 44, color = t.ink }) => (
  <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
    <span
      style={{
        fontFamily: t.numerals,
        fontSize: size,
        fontWeight: 600,
        color,
        lineHeight: 0.9,
        letterSpacing: "-0.01em",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </span>
    {unit && (
      <span style={{ fontFamily: t.numerals, fontSize: size * 0.36, color: t.muted }}>{unit}</span>
    )}
  </span>
)

const Delta = ({ value, unit, invert = false }) => {
  const up = value >= 0
  const bad = invert ? !up : up
  return (
    <span
      style={{ fontSize: 12, color: bad ? t.warning : t.muted, fontVariantNumeric: "tabular-nums" }}
    >
      {up ? "+" : "−"}
      {format(Math.abs(value), 1)}
      {unit} vs 30-min mean
    </span>
  )
}

const Panel = ({ span, title, readout, aside, children }) => (
  <section
    style={{
      gridColumn: `span ${span}`,
      background: t.panel,
      borderRadius: 10,
      padding: "14px 18px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      minWidth: 0,
    }}
  >
    <div style={{ fontSize: 13, color: t.muted }}>{title}</div>
    {(readout || aside) && (
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        {readout}
        {aside}
      </div>
    )}
    {children}
  </section>
)

const Stat = ({ title, values, unit, digits, color, id }) => {
  const { last, mean } = stats(values)
  return (
    <Panel
      span={3}
      title={title}
      readout={<Readout value={format(last, digits)} unit={unit} />}
      aside={<Delta value={last - mean} unit={unit === "%" ? "%" : ""} />}
    >
      <Sparkline values={values} color={color} height={36} width={300} id={id} />
    </Panel>
  )
}

const Bullet = ({ value }) => (
  <Panel
    span={3}
    title="Memory used, of 64 GiB"
    readout={<Readout value={format(value, 1)} unit="%" />}
    aside={<span style={{ fontSize: 12, color: t.muted }}>45.6 GiB</span>}
  >
    <div style={{ position: "relative", height: 36, marginTop: 6 }}>
      <div
        style={{
          position: "absolute",
          inset: "10px 0",
          display: "flex",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div style={{ flex: 80, background: t.raised }} />
        <div style={{ flex: 10, background: `${t.warning}33` }} />
        <div style={{ flex: 10, background: `${t.critical}33` }} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 14,
          bottom: 14,
          left: 0,
          width: `${value}%`,
          background: t.series[1],
          borderRadius: 2,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          left: "85%",
          width: 2,
          background: t.ink,
          borderRadius: 1,
        }}
        title="Alert at 85%"
      />
      <div
        style={{
          position: "absolute",
          bottom: -12,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: t.faint,
        }}
      >
        <span>0</span>
        <span
          style={{
            position: "absolute",
            left: "85%",
            transform: "translateX(-50%)",
            color: t.muted,
          }}
        >
          alert 85
        </span>
        <span>100</span>
      </div>
    </div>
  </Panel>
)

const DirectChart = ({ series, min, max, bands = [], height = 210, id }) => {
  const width = 820
  const labelWidth = 118
  const scales = makeScales({ width, height, min, max, pad: [6, labelWidth, 20, 0] })
  const { plot } = scales
  const labels = series
    .map(s => ({ ...s, y: scales.y(s.values[s.values.length - 1]) }))
    .sort((a, b) => a.y - b.y)
  labels.forEach((label, index) => {
    if (index && label.y - labels[index - 1].y < 16) label.y = labels[index - 1].y + 16
  })

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height }}>
      <defs>
        {series.map((s, index) => (
          <Gradient key={s.id} id={`${id}-${index}`} color={s.color} from={0.3} />
        ))}
      </defs>
      {bands.map(band => (
        <g key={band.from}>
          <rect
            x={plot.left}
            width={plot.right - plot.left}
            y={scales.y(band.to)}
            height={scales.y(band.from) - scales.y(band.to)}
            fill={band.color}
            opacity="0.08"
          />
          <text
            x={plot.left + 4}
            y={scales.y(band.to) + 13}
            fill={band.color}
            fontSize="11"
            opacity="0.9"
          >
            {band.label}
          </text>
        </g>
      ))}
      <line x1={plot.left} x2={plot.right} y1={plot.bottom} y2={plot.bottom} stroke={t.grid} />
      {series.map((s, index) => (
        <g key={s.id}>
          {s.fill && <path d={areaPath(s.values, scales, min)} fill={`url(#${id}-${index})`} />}
          <path d={linePath(s.values, scales)} fill="none" stroke={s.color} strokeWidth="2" />
        </g>
      ))}
      {labels.map(label => (
        <g key={label.id}>
          <circle
            cx={plot.right}
            cy={scales.y(label.values[label.values.length - 1])}
            r="3"
            fill={label.color}
          />
          <text x={plot.right + 10} y={label.y + 4} fontSize="12" fill={t.ink}>
            <tspan
              fontFamily={t.numerals}
              fontWeight="600"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {format(label.values[label.values.length - 1], label.digits ?? 0)}
            </tspan>
            <tspan fill={label.color} dx="6">
              {label.id}
            </tspan>
          </text>
        </g>
      ))}
      <text x={plot.right + 10} y={plot.top + 8} fontSize="10" fill={t.faint}>
        max {max}
      </text>
      {timeLabels.map((label, index) => (
        <text
          key={label}
          x={((plot.right - plot.left) * (index + 0.5)) / timeLabels.length}
          y={height - 4}
          textAnchor="middle"
          fill={t.faint}
          fontSize="11"
        >
          {label}
        </text>
      ))}
    </svg>
  )
}

const Incidents = ({ services }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {services.map(service => {
      const worst =
        service.segments.find(([state]) => state === "critical") ||
        service.segments.find(([state]) => state === "warning" || state === "off")
      return (
        <div
          key={service.id}
          style={{
            display: "grid",
            gridTemplateColumns: "72px 1fr 86px",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 13, color: t.ink }}>{service.id}</span>
          <div
            style={{
              display: "flex",
              height: 6,
              borderRadius: 3,
              overflow: "hidden",
              background: t.raised,
            }}
          >
            {service.segments.map(([state, share], index) => (
              <div
                key={index}
                style={{ flex: share, background: state === "ok" ? "transparent" : t[state] }}
              />
            ))}
          </div>
          <span style={{ fontSize: 12, color: worst ? t[worst[0]] : t.muted, textAlign: "right" }}>
            {worst ? `${Math.round(worst[1] * 30)} min ${worst[0]}` : "No issues"}
          </span>
        </div>
      )
    })}
  </div>
)

const Filesystems = ({ items }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
    {items.map(item => {
      const color = item.used >= 90 ? t.critical : item.used >= 80 ? t.warning : t.ink
      return (
        <div
          key={item.id}
          style={{
            background: t.raised,
            borderRadius: 8,
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minWidth: 0,
          }}
        >
          <Readout value={item.used} unit="%" size={30} color={color} />
          <div style={{ height: 3, borderRadius: 2, background: t.grid }}>
            <div
              style={{
                width: `${item.used}%`,
                height: "100%",
                borderRadius: 2,
                background: item.used >= 80 ? color : t.series[1],
              }}
            />
          </div>
          <span
            style={{
              fontSize: 11,
              color: t.muted,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.id}
          </span>
        </div>
      )
    })}
  </div>
)

export default () => {
  const cpuTotal = data.cpuUser.map((v, i) => v + data.cpuSystem[i])
  const cpu = [
    { id: "user", values: data.cpuUser, color: t.series[0], fill: true, digits: 1 },
    { id: "system", values: data.cpuSystem, color: t.series[1], fill: true, digits: 1 },
  ]
  const disks = data.disks.map((disk, index) => ({ ...disk, color: t.series[index] }))
  const cpuStats = stats(cpuTotal)
  const diskTotal = disks.reduce((sum, disk) => sum + stats(disk.values).last, 0)

  return (
    <div
      style={{
        background: t.ground,
        padding: 24,
        fontFamily: t.font,
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gap: 14,
      }}
    >
      <Stat
        title="CPU, all cores"
        values={cpuTotal}
        unit="%"
        digits={1}
        color={t.series[0]}
        id="ro-s1"
      />
      <Stat
        title="Load, 1 min"
        values={data.load}
        unit=""
        digits={2}
        color={t.series[2]}
        id="ro-s2"
      />
      <Stat
        title="Network in, eth0"
        values={data.netIn}
        unit="Gbit/s"
        digits={2}
        color={t.series[3]}
        id="ro-s3"
      />
      <Bullet value={stats(data.memory).last} />
      <Panel
        span={8}
        title="CPU utilization, averaged over 32 cores"
        readout={
          <Readout
            value={format(cpuStats.last, 1)}
            unit="%"
            size={52}
            color={cpuStats.last >= 70 ? t.warning : t.ink}
          />
        }
        aside={<Delta value={cpuStats.last - cpuStats.mean} unit="%" />}
      >
        <DirectChart
          series={cpu}
          min={0}
          max={100}
          bands={[
            { from: 70, to: 85, color: t.warning, label: "Warning 70–85%" },
            { from: 85, to: 100, color: t.critical, label: "Critical above 85%" },
          ]}
          id="ro-cpu"
        />
      </Panel>
      <Panel
        span={4}
        title="Service health, last 30 minutes"
        readout={<Readout value="2" unit="incidents" size={52} color={t.warning} />}
      >
        <Incidents services={data.services} />
      </Panel>
      <Panel
        span={7}
        title="Disk reads per device"
        readout={<Readout value={format(diskTotal, 0)} unit="KiB/s total" size={40} />}
      >
        <DirectChart series={disks} min={0} max={700} height={200} id="ro-disk" />
      </Panel>
      <Panel
        span={5}
        title="Filesystem usage"
        readout={<Readout value="2" unit="above 80%" size={40} color={t.warning} />}
      >
        <Filesystems items={data.filesystems} />
      </Panel>
    </div>
  )
}
