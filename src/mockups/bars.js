import React from "react"
import { themes, font } from "./chartCard"

const numerals = "'IBM Plex Sans Condensed', 'IBM Plex Sans', system-ui, sans-serif"

const tiles = [
  {
    title: "Unicast",
    rows: [
      { name: "out", value: 1189, label: "1.189", unit: "M" },
      { name: "in", value: 925.9, label: "925.9", unit: "K" },
    ],
  },
  {
    title: "Multicast",
    rows: [
      { name: "out", value: 133.4, label: "133.4", unit: "K" },
      { name: "in", value: 79, label: "79", unit: "K" },
    ],
  },
  {
    title: "Broadcast",
    rows: [
      { name: "out", value: 23.46, label: "23.46", unit: "K" },
      { name: "in", value: 14.08, label: "14.08", unit: "K" },
    ],
  },
]

const mounts = [
  ["/", 82.4],
  ["/var/lib/docker", 71.2],
  ["/home", 44.8],
  ["/var/log", 31.5],
  ["/boot", 22.1],
  ["/opt/netdata", 12.6],
  ["/tmp", 4.3],
  ["/srv/backups", 1.2],
].map(([name, value]) => ({ name, value, label: value.toFixed(1), unit: "%" }))

const colorOf = (t, name, index) =>
  name === "in" ? t.series[0] : name === "out" ? t.series[1] : t.series[index % t.series.length]

const alpha = (hex, a) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

const Value = ({ t, row, strong }) => (
  <span style={{ display: "flex", alignItems: "baseline", gap: 3, flex: "none" }}>
    <span
      style={{ fontFamily: numerals, fontSize: 13, fontWeight: strong ? 600 : 500, color: t.ink }}
    >
      {row.label}
    </span>
    <span style={{ fontSize: 10.5, color: t.muted }}>{row.unit}</span>
  </span>
)

const Name = ({ t, row, strong }) => (
  <span
    style={{
      fontSize: 12.5,
      color: t.ink,
      fontWeight: strong ? 600 : 400,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      minWidth: 0,
      flex: 1,
    }}
  >
    {row.name}
  </span>
)

const percentOf = (rows, row) => (row.value / Math.max(...rows.map(item => item.value))) * 100

const TintRow = ({ t, rows, row, index }) => {
  const color = colorOf(t, row.name, index)
  const pct = percentOf(rows, row)
  return (
    <div
      style={{
        position: "relative",
        height: 24,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 8px",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${pct}%`,
          borderRadius: 4,
          background: alpha(color, index === 0 ? 0.22 : 0.14),
          boxShadow: `inset -2px 0 0 ${color}`,
        }}
      />
      <span
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flex: 1,
          minWidth: 0,
        }}
      >
        <Name t={t} row={row} />
        <Value t={t} row={row} strong={index === 0} />
      </span>
    </div>
  )
}

const MeterRow = ({ t, rows, row, index }) => {
  const color = colorOf(t, row.name, index)
  const pct = percentOf(rows, row)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "2px 0" }}>
      <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <Name t={t} row={row} />
        <Value t={t} row={row} strong={index === 0} />
      </span>
      <span style={{ height: 3, borderRadius: 2, background: t.grid, overflow: "hidden" }}>
        <span
          style={{
            display: "block",
            height: "100%",
            width: `${pct}%`,
            borderRadius: 2,
            background: color,
          }}
        />
      </span>
    </div>
  )
}

const LeaderRow = ({ t, rows, row, index }) => {
  const color = colorOf(t, row.name, index)
  const pct = percentOf(rows, row)
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(48px, 30%) 1fr auto",
        alignItems: "center",
        gap: 10,
        height: 22,
      }}
    >
      <Name t={t} row={row} />
      <span style={{ position: "relative", height: 6 }}>
        <span
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 2.5,
            height: 1,
            background: t.grid,
          }}
        />
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 1,
            height: 4,
            width: `${pct}%`,
            borderRadius: 2,
            background: color,
          }}
        />
      </span>
      <Value t={t} row={row} strong={index === 0} />
    </div>
  )
}

const variants = [
  {
    id: "tint",
    title: "A. Compact tint",
    note: "Keeps the whole-row tint, but each row is 24px instead of 40px. A 2px edge in the series colour marks where the value ends.",
    Row: TintRow,
    gap: 4,
  },
  {
    id: "meter",
    title: "B. Slim meter",
    note: "Name and value on one line, a 3px meter in full series colour underneath on a faint track. Quietest; reads like an instrument.",
    Row: MeterRow,
    gap: 8,
  },
  {
    id: "leader",
    title: "C. Leader line",
    note: "Name, a thin line coloured up to the value, then the value. Densest; the bars line up across rows like a spec sheet.",
    Row: LeaderRow,
    gap: 4,
  },
]

const Tile = ({ t, title, rows, Row, gap, width = 300 }) => (
  <div
    style={{
      width,
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      fontFamily: font,
    }}
  >
    <span style={{ fontSize: 15, color: t.muted }}>{title}</span>
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {rows.map((row, index) => (
        <Row key={row.name} t={t} rows={rows} row={row} index={index} />
      ))}
    </div>
  </div>
)

const Current = ({ t, rows }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    {rows.map((row, index) => {
      const color = colorOf(t, row.name, index)
      return (
        <div
          key={row.name}
          style={{
            position: "relative",
            height: 40,
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
            gap: 8,
          }}
        >
          <span
            style={{
              position: "absolute",
              inset: 0,
              width: `${percentOf(rows, row)}%`,
              borderRadius: 4,
              background: alpha(color, index === 0 ? 0.24 : 0.16),
            }}
          />
          <span
            style={{ position: "relative", display: "flex", flex: 1, gap: 8, alignItems: "center" }}
          >
            <Name t={t} row={row} />
            <Value t={t} row={row} strong={index === 0} />
          </span>
        </div>
      )
    })}
  </div>
)

export const BarsMockups = ({ theme = "dark" }) => {
  const t = themes[theme]
  return (
    <div
      style={{
        background: t.ground,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 28,
        fontFamily: font,
        color: t.ink,
      }}
    >
      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Today</span>
        <div
          style={{
            width: 300,
            background: t.panel,
            border: `1px solid ${t.border}`,
            borderRadius: 10,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 15, color: t.muted }}>Unicast</span>
          <Current t={t} rows={tiles[0].rows} />
        </div>
      </section>
      {variants.map(({ id, title, note, Row, gap }) => (
        <section key={id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
          <span style={{ fontSize: 12, color: t.muted, maxWidth: 760 }}>{note}</span>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
            {tiles.map(tile => (
              <Tile
                key={tile.title}
                t={t}
                title={tile.title}
                rows={tile.rows}
                Row={Row}
                gap={gap}
              />
            ))}
            <Tile t={t} title="Disk space used" rows={mounts} Row={Row} gap={gap} width={340} />
          </div>
        </section>
      ))}
    </div>
  )
}
