import React, { useState } from "react"
import { Sparkline, format, wave } from "./primitives"
import { themes, font, Icon, icons } from "./chartCard"

const numerals = "'IBM Plex Sans Condensed', 'IBM Plex Sans', system-ui, sans-serif"

const groups = [
  { id: "latency", label: "Latency", unit: "ms/op", columns: ["Reads", "Writes"], digits: 2 },
  { id: "io", label: "Throughput", unit: "KiB/s", columns: ["Reads", "Writes"], digits: 0 },
  { id: "iops", label: "Operations", unit: "ops/s", columns: ["Reads", "Writes"], digits: 1 },
  { id: "util", label: "Utilization", unit: "%", columns: ["Busy"], digits: 1, percent: true },
]

const rows = [
  {
    device: "nvme0n1",
    node: "prod-db-1",
    status: "critical",
    values: [4.82, 9.1, 18420, 9210, 1220, 640, 93.4],
  },
  {
    device: "nvme1n1",
    node: "prod-db-1",
    status: "warning",
    values: [2.1, 3.4, 9120, 4410, 610, 330, 78.2],
  },
  {
    device: "sda",
    node: "prod-edge-1",
    status: "ok",
    values: [0.41, 0.62, 2210, 880, 120, 60, 22.6],
  },
  {
    device: "sdb",
    node: "prod-edge-1",
    status: "ok",
    values: [0.38, null, 1840, null, 98, null, 18.9],
  },
  {
    device: "mtdblock0",
    node: "23340433",
    status: "ok",
    values: [0, null, 0, null, 0, null, null],
  },
  {
    device: "dm-0",
    node: "prod-jobs-2",
    status: "ok",
    values: [0.9, 1.2, 4410, 2290, 260, 140, 41.0],
  },
]

const trendFor = (row, column) =>
  wave({
    center: 50,
    amplitude: 18,
    cycles: 2 + ((row * 3 + column) % 4) * 0.5,
    phase: row + column,
    seed: row * 7 + column + 3,
    noise: 0.25,
  })

const Header = ({ t, hovered, searching, onSearch }) => (
  <header
    style={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      padding: "14px 16px 8px",
    }}
  >
    <div style={{ minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>Disk activity</span>
        <span style={{ fontSize: 12, color: t.muted }}>6 devices on 4 nodes</span>
      </div>
      <div style={{ fontSize: 12, color: t.faint, marginTop: 3 }}>
        Group by device and node, Average, Average every 5s
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {searching && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: `1px solid ${t.border}`,
            borderRadius: 7,
            padding: "4px 8px",
            fontSize: 12,
            color: t.faint,
            width: 180,
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle cx="7" cy="7" r="4.5" />
            <path d="M10.5 10.5 14 14" />
          </svg>
          Filter devices or nodes
        </span>
      )}
      <span
        style={{
          display: "flex",
          opacity: hovered || searching ? 1 : 0,
          transition: "opacity 120ms",
        }}
      >
        <span onClick={onSearch}>
          <Icon
            path="M7 2.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zM10.5 10.5 14 14"
            t={t}
            label="Search"
          />
        </span>
        <Icon path={icons.expand} t={t} label="Full screen" />
        <Icon path={icons.more} t={t} label="More" />
      </span>
      <span
        title="1 critical, 1 warning"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11.5,
          fontWeight: 600,
          color: t.panel,
          background: t.critical,
          borderRadius: 999,
          padding: "2px 8px",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: 999, background: t.panel }} />1 critical
      </span>
    </div>
  </header>
)

const Cell = ({ t, value, max, digits, percent, trend, accent, rowHover }) => {
  if (value === null)
    return (
      <td
        title="This device reports no value for this column"
        style={{
          padding: "8px 14px",
          textAlign: "right",
          color: t.faint,
          fontFamily: numerals,
          fontSize: 13,
        }}
      >
        –
      </td>
    )

  const share = max ? Math.min(1, value / max) : 0
  const hot = percent && value >= 80

  return (
    <td style={{ padding: "6px 14px", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: 6,
          right: 6,
          top: 5,
          bottom: 5,
          borderRadius: 4,
          background: hot ? `${t.warning}22` : `${t.series[1]}${rowHover ? "26" : "14"}`,
          transformOrigin: "right",
          transform: `scaleX(${share})`,
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        {trend && (
          <div style={{ width: 64, opacity: rowHover ? 1 : 0.55, transition: "opacity 120ms" }}>
            <Sparkline
              values={trend}
              color={rowHover ? accent : t.muted}
              width={64}
              height={18}
              fill={false}
              id={`tb-${accent}-${value}`}
            />
          </div>
        )}
        <span
          style={{
            fontFamily: numerals,
            fontSize: 13.5,
            fontWeight: 600,
            color: hot ? t.warning : t.ink,
            fontVariantNumeric: "tabular-nums",
            minWidth: 54,
            textAlign: "right",
          }}
        >
          {format(value, value >= 100 ? 0 : digits)}
        </span>
      </div>
    </td>
  )
}

const statusColor = t => ({ critical: t.critical, warning: t.warning, ok: t.series[0] })

export const ModernTableMock = ({
  theme = "dark",
  hovered: forcedHover = false,
  searching = false,
  hoverRow = null,
  trends = true,
}) => {
  const t = themes[theme]
  const [hovered, setHovered] = useState(false)
  const [rowHover, setRowHover] = useState(hoverRow)
  const [search, setSearch] = useState(searching)
  const flat = groups.flatMap(group => group.columns.map(column => ({ group, column })))
  const maxes = flat.map((_, index) => Math.max(...rows.map(row => row.values[index] || 0)))
  const head = {
    fontSize: 11.5,
    color: t.faint,
    fontWeight: 400,
    padding: "4px 14px",
    textAlign: "right",
    whiteSpace: "nowrap",
  }

  return (
    <section
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        fontFamily: font,
        overflow: "hidden",
      }}
    >
      <Header
        t={t}
        hovered={forcedHover || hovered}
        searching={search}
        onSearch={() => setSearch(open => !open)}
      />
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...head, textAlign: "left", padding: "6px 16px 2px" }} />
            {groups.map(group => (
              <th
                key={group.id}
                colSpan={group.columns.length}
                style={{ ...head, textAlign: "center", padding: "6px 14px 2px", color: t.muted }}
              >
                <span style={{ color: t.ink, fontWeight: 600 }}>{group.label}</span>
                <span style={{ marginLeft: 6 }}>{group.unit}</span>
              </th>
            ))}
          </tr>
          <tr style={{ borderBottom: `1px solid ${t.grid}` }}>
            <th style={{ ...head, textAlign: "left", padding: "4px 16px 8px", color: t.ink }}>
              Device ↓
            </th>
            {flat.map(({ group, column }) => (
              <th key={`${group.id}-${column}`} style={{ ...head, paddingBottom: 8 }}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={`${row.device}-${row.node}`}
              onMouseEnter={() => setRowHover(rowIndex)}
              onMouseLeave={() => setRowHover(hoverRow)}
              style={{
                borderTop: rowIndex ? `1px solid ${t.grid}` : "none",
                background: rowHover === rowIndex ? t.chip : "transparent",
              }}
            >
              <td style={{ padding: "8px 16px", whiteSpace: "nowrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 999,
                      background: statusColor(t)[row.status],
                      opacity: row.status === "ok" ? 0.55 : 1,
                    }}
                  />
                  <span style={{ fontSize: 13, color: t.ink, fontWeight: 500 }}>{row.device}</span>
                </div>
                <div style={{ fontSize: 11.5, color: t.faint, paddingLeft: 15, marginTop: 1 }}>
                  {row.node}
                </div>
              </td>
              {flat.map(({ group }, index) => (
                <Cell
                  key={index}
                  t={t}
                  value={row.values[index]}
                  max={maxes[index]}
                  digits={group.digits}
                  percent={group.percent}
                  trend={trends && !group.percent ? trendFor(rowIndex, index) : null}
                  accent={t.series[1]}
                  rowHover={rowHover === rowIndex}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 16px 12px",
          fontSize: 11.5,
          color: t.faint,
          borderTop: `1px solid ${t.grid}`,
        }}
      >
        <span>6 of 6 devices, sorted by name</span>
        <span>Latest Thu, Oct 01 2026, 11:41:09</span>
      </footer>
    </section>
  )
}

export const TableMockups = ({ theme = "dark" }) => {
  const t = themes[theme]
  const caption = { fontSize: 13, color: t.muted, margin: "8px 0 6px", fontFamily: font }
  return (
    <div style={{ background: t.ground, minHeight: "100vh", padding: 28, boxSizing: "border-box" }}>
      <div style={caption}>
        At rest: units in the headers, numbers only in the cells, magnitude bars per column
      </div>
      <ModernTableMock theme={theme} />
      <div style={caption}>
        Hover: actions appear, the hovered row lifts its trends; search opens in the header
      </div>
      <ModernTableMock theme={theme} hovered searching hoverRow={0} />
      <div style={caption}>Without trends (narrow cards or many columns)</div>
      <ModernTableMock theme={theme} trends={false} />
    </div>
  )
}
