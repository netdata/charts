import React, { useState } from "react"
import { Sparkline, arcPath, polar, wave, format } from "./primitives"
import { themes, font, Icon, icons } from "./chartCard"

const numerals = "'IBM Plex Sans Condensed', 'IBM Plex Sans', system-ui, sans-serif"

const extra = {
  ai: "M8 2.5v2M8 11.5v2M2.5 8h2M11.5 8h2M4.2 4.2l1.4 1.4M10.4 10.4l1.4 1.4M4.2 11.8l1.4-1.4M10.4 5.6l1.4-1.4",
  bell: "M4 11V7a4 4 0 1 1 8 0v4l1 1.5H3zM6.5 13.5a1.5 1.5 0 0 0 3 0",
  save: "M3 3h8l2 2v8H3zM5 3v3h5V3M5 13V9h6v4",
  drag: "M6 4h.01M10 4h.01M6 8h.01M10 8h.01M6 12h.01M10 12h.01",
}

const Readout = ({ t, value, unit, size = 30, color }) => (
  <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4, minWidth: 0 }}>
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
    <span
      style={{
        fontFamily: numerals,
        fontSize: Math.max(11, size * 0.4),
        color: t.muted,
        whiteSpace: "nowrap",
      }}
    >
      {unit}
    </span>
  </span>
)

const AlertDot = ({ t, tone, label }) => (
  <span
    title={label}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 11,
      color: t[tone],
      whiteSpace: "nowrap",
    }}
  >
    <span style={{ width: 7, height: 7, borderRadius: 999, background: t[tone] }} />
    {label}
  </span>
)

const Menu = ({ t }) => (
  <div
    style={{
      position: "absolute",
      top: 34,
      right: 8,
      width: 220,
      background: t.hoverBg,
      boxShadow: t.hoverShadow,
      borderRadius: 10,
      padding: 6,
      zIndex: 5,
      fontSize: 12.5,
      color: t.ink,
    }}
  >
    <div
      style={{
        display: "flex",
        gap: 2,
        padding: "2px 4px 6px",
        borderBottom: `1px solid ${t.grid}`,
        marginBottom: 4,
      }}
    >
      {[extra.ai, extra.bell, extra.save, icons.expand].map(path => (
        <Icon key={path} path={path} t={t} label="Dashboard action" />
      ))}
    </div>
    {[
      "Nodes, 4 selected",
      "Instances, all",
      "Dimensions, all",
      "Labels, none",
      "Group by and aggregation",
    ].map(item => (
      <div
        key={item}
        style={{
          padding: "5px 8px",
          borderRadius: 5,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{item.split(",")[0]}</span>
        <span style={{ color: t.faint }}>{item.split(",")[1] || "›"}</span>
      </div>
    ))}
    <div style={{ height: 1, background: t.grid, margin: "4px 0" }} />
    {["Chart settings", "Chart info", "Reload data"].map(item => (
      <div key={item} style={{ padding: "5px 8px", borderRadius: 5 }}>
        {item}
      </div>
    ))}
  </div>
)

const Tile = ({
  t,
  title,
  scope,
  width = 300,
  height = 190,
  hovered: forced,
  menu = false,
  editing = false,
  alert,
  children,
}) => {
  const [hover, setHover] = useState(false)
  const hovered = forced || hover || menu

  return (
    <section
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        width,
        height,
        boxSizing: "border-box",
        background: t.panel,
        border: `1px solid ${hovered ? t.border : "transparent"}`,
        borderRadius: 10,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        overflow: "visible",
        fontFamily: font,
      }}
    >
      <header style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 22 }}>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 12.5,
            fontWeight: 500,
            color: t.muted,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </span>
        {alert && !hovered && <AlertDot t={t} tone={alert.tone} label={alert.label} />}
        {hovered && (
          <span style={{ display: "flex", gap: 0 }}>
            {editing && <Icon path={extra.drag} t={t} label="Move tile" />}
            <Icon path={icons.expand} t={t} label="Full screen" />
            <span style={{ borderRadius: 6, background: menu ? t.chip : "transparent" }}>
              <Icon path={icons.more} t={t} label="More" />
            </span>
          </span>
        )}
      </header>
      <div
        style={{
          height: 14,
          fontSize: 11,
          color: t.faint,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          visibility: hovered ? "visible" : "hidden",
        }}
      >
        {scope}
      </div>
      {children}
      {menu && <Menu t={t} />}
    </section>
  )
}

export const SparkTile = ({
  t,
  values,
  unit,
  digits = 1,
  color,
  id,
  width = 300,
  height = 190,
  ...rest
}) => {
  const last = values[values.length - 1]
  return (
    <Tile t={t} width={width} height={height} {...rest}>
      <Readout
        t={t}
        value={format(last, digits)}
        unit={unit}
        size={width > 320 ? 34 : 28}
        color={rest.alert ? t[rest.alert.tone] : undefined}
      />
      <div
        style={{
          flex: 1,
          margin: "6px -12px -10px",
          minHeight: 0,
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
          borderRadius: "0 0 10px 10px",
        }}
      >
        <Sparkline
          values={values}
          color={rest.alert ? t[rest.alert.tone] : color}
          width={300}
          height={height - 96}
          id={id}
        />
      </div>
    </Tile>
  )
}

export const RingTile = ({ t, value, max, unit, color, ...rest }) => {
  const r = 46
  const c = 2 * Math.PI * r
  const share = Math.min(1, value / max)
  return (
    <Tile t={t} {...rest}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 14 }}>
        <svg viewBox="0 0 110 110" style={{ width: 104, height: 104, flexShrink: 0 }}>
          <circle cx="55" cy="55" r={r} stroke={t.grid} strokeWidth="9" fill="none" />
          <circle
            cx="55"
            cy="55"
            r={r}
            stroke={color}
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c * share} ${c}`}
            transform="rotate(-90 55 55)"
          />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <Readout t={t} value={format(value, 0)} unit={unit} size={30} />
          <span
            style={{ fontSize: 11, color: t.faint }}
          >{`${Math.round(share * 100)}% of ${format(max, 0)} ${unit} peak`}</span>
        </div>
      </div>
    </Tile>
  )
}

export const GaugeTile = ({ t, value, unit, color, ...rest }) => {
  const cx = 80
  const cy = 76
  const r = 60
  const a0 = Math.PI * 0.8
  const a1 = Math.PI * 2.2
  const at = v => a0 + ((a1 - a0) * v) / 100
  const [kx, ky] = polar(cx, cy, r, at(value))
  return (
    <Tile t={t} {...rest}>
      <div style={{ flex: 1, display: "flex", justifyContent: "center", minHeight: 0 }}>
        <svg viewBox="0 0 160 130" style={{ height: "100%", maxHeight: 130 }}>
          <path
            d={arcPath(cx, cy, r, a0, a1)}
            stroke={t.grid}
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={arcPath(cx, cy, r, a0, at(value))}
            stroke={color}
            strokeWidth="9"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx={kx} cy={ky} r="5.5" fill={t.panel} stroke={color} strokeWidth="2.5" />
          <text
            x={cx}
            y={cy + 8}
            textAnchor="middle"
            fill={t.ink}
            fontFamily={numerals}
            fontSize="30"
            fontWeight="600"
          >
            {format(value, 1)}
            <tspan fontSize="13" fill={t.muted} dx="2">
              {unit}
            </tspan>
          </text>
        </svg>
      </div>
    </Tile>
  )
}

export const BarsTile = ({ t, items, unit, ...rest }) => (
  <Tile t={t} {...rest}>
    <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 2 }}>
      {items.map((item, index) => (
        <div
          key={item.id}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 70px 46px",
            gap: 8,
            alignItems: "center",
            fontSize: 12,
          }}
        >
          <span
            title={item.id}
            style={{
              color: t.ink,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.id}
          </span>
          <span style={{ height: 6, borderRadius: 3, background: t.grid }}>
            <span
              style={{
                display: "block",
                width: `${item.value}%`,
                height: "100%",
                borderRadius: 3,
                background: t.series[index % t.series.length],
              }}
            />
          </span>
          <span
            style={{
              textAlign: "right",
              fontWeight: index === 0 ? 600 : 400,
              color: t.ink,
              fontVariantNumeric: "tabular-nums",
            }}
          >{`${format(item.value, 1)}${unit}`}</span>
        </div>
      ))}
      <span style={{ fontSize: 11, color: t.faint }}>5 more nodes</span>
    </div>
  </Tile>
)

export const HighlightChip = ({ t, compact }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      border: `1px solid ${t.border}`,
      borderRadius: 999,
      padding: "3px 10px",
      fontSize: 11.5,
      color: t.muted,
      whiteSpace: "nowrap",
      fontFamily: font,
    }}
  >
    <span>Highlight</span>
    <span style={{ color: t.ink, fontVariantNumeric: "tabular-nums" }}>
      {compact ? "06:35:02–06:35:07" : "Wed 30 Sep, 06:35:02–06:35:07"}
    </span>
    <span>5s</span>
  </span>
)

export const Tiles = ({ theme = "dark" }) => {
  const t = themes[theme]
  const disk = wave({ center: 640, amplitude: 120, cycles: 3, seed: 51 })
  const cpuPressure = wave({ center: 2.9, amplitude: 1.6, cycles: 2, seed: 52, noise: 0.3 })
  const load = wave({ center: 0.5, amplitude: 0.2, cycles: 1.6, seed: 53 })
  const row = { display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }
  const Caption = ({ children }) => (
    <div style={{ fontSize: 13, color: t.muted, margin: "6px 0 -4px", fontFamily: font }}>
      {children}
    </div>
  )

  return (
    <div
      style={{
        background: t.ground,
        minHeight: "100vh",
        padding: 28,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <Caption>At rest: title, readout and trend only. Hover any tile.</Caption>
      <div style={row}>
        <SparkTile
          t={t}
          title="Average disk I/O utilization"
          scope="4 nodes, average every 5s"
          values={cpuPressure}
          unit="%"
          digits={2}
          color={t.series[1]}
          id="tl-1"
        />
        <SparkTile
          t={t}
          title="Avg CPU pressure"
          scope="4 nodes, some 10s"
          values={cpuPressure.map(v => v * 0.9)}
          unit="%"
          digits={2}
          color={t.series[1]}
          id="tl-2"
          alert={{ tone: "warning", label: "1 warning" }}
        />
        <SparkTile
          t={t}
          title="Avg system load"
          scope="4 nodes, load1"
          values={load}
          unit="threads"
          digits={2}
          color={t.series[0]}
          id="tl-3"
        />
        <RingTile
          t={t}
          title="Total disk reads"
          scope="4 nodes, sum every 5s"
          value={648}
          max={1210}
          unit="KiB/s"
          color={t.series[1]}
        />
      </div>
      <div style={row}>
        <GaugeTile
          t={t}
          title="Avg CPU per node"
          scope="4 nodes, average"
          value={7.61}
          unit="%"
          color={t.series[1]}
        />
        <BarsTile
          t={t}
          title="Top nodes by CPU"
          scope="11 nodes, top 6"
          unit="%"
          items={[
            { id: "netdata-parent-1", value: 49.4 },
            { id: "netdata-old-ui", value: 49.4 },
            { id: "ip-10-200-1-17", value: 49.3 },
            { id: "ip-10-200-3-4", value: 14.3 },
          ]}
        />
        <SparkTile
          t={t}
          title="Total disk reads"
          scope="4 nodes, sum every 5s"
          values={disk}
          unit="KiB/s"
          digits={0}
          color={t.series[3]}
          id="tl-4"
          width={420}
        />
      </div>
      <Caption>
        Hover: two controls and the query scope. Editing a dashboard adds the move handle.
      </Caption>
      <div style={row}>
        <SparkTile
          t={t}
          title="Avg CPU pressure"
          scope="4 nodes, some 10s"
          values={cpuPressure}
          unit="%"
          digits={2}
          color={t.series[1]}
          id="tl-5"
          hovered
        />
        <SparkTile
          t={t}
          title="Avg CPU pressure"
          scope="4 nodes, some 10s"
          values={cpuPressure}
          unit="%"
          digits={2}
          color={t.series[1]}
          id="tl-6"
          hovered
          editing
        />
        <div style={{ position: "relative" }}>
          <SparkTile
            t={t}
            title="Avg CPU pressure"
            scope="4 nodes, some 10s"
            values={cpuPressure}
            unit="%"
            digits={2}
            color={t.series[1]}
            id="tl-7"
            menu
          />
        </div>
      </div>
      <div style={{ height: 160 }} />
      <Caption>Highlight chip: one line, the date drops when it is today</Caption>
      <div style={row}>
        <HighlightChip t={t} />
        <HighlightChip t={t} compact />
      </div>
    </div>
  )
}
