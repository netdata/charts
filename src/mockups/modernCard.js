import React, { useMemo, useState } from "react"
import { format, points, stats } from "./primitives"
import {
  Icon,
  LegendTable,
  Plot,
  Tooltip,
  datasets,
  font,
  icons,
  themes,
  timeAt,
} from "./chartCard"

const numerals = "'IBM Plex Sans Condensed', 'IBM Plex Sans', system-ui, sans-serif"

const extraIcons = {
  dashboard: "M2.5 2.5h4.5v4.5h-4.5zM9 2.5h4.5v4.5H9zM2.5 9h4.5v4.5h-4.5zM11.25 9v4.5M9 11.25h4.5",
  reset: "M3 8a5 5 0 1 0 1.5-3.5M3 2.5v3h3",
}

export const pickLegend = ({ width, count }) => {
  if (width < 420) return "hidden"
  if (width >= 900 || count > 6) return "table"
  if (count <= 4) return "direct"
  return "below"
}

const anomalyRates = Array.from({ length: points }, (_, index) =>
  index > 92 && index < 104 ? 30 + ((index * 37) % 60) : index % 41 === 0 ? 20 : 0
)

const Readout = ({ t, data, hoverIndex, compact = false }) => {
  const ranked = data.series
    .map((s, index) => ({ ...s, color: t.series[index % t.series.length], ...stats(s.values) }))
    .sort((a, b) => b.last - a.last)
  const focus = ranked[0]
  const value = hoverIndex != null ? focus.values[hoverIndex] : focus.last
  const delta = focus.last - focus.mean
  const hot = data.alert && focus.last >= data.alert.warning

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
      <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 12, color: focus.color, fontWeight: 500 }}>{focus.id}</span>
        <span
          style={{
            fontFamily: numerals,
            fontSize: compact ? 22 : 30,
            fontWeight: 600,
            lineHeight: 1,
            color: hot ? t.warning : t.ink,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.01em",
          }}
        >
          {format(value, data.digits)}
        </span>
        <span style={{ fontFamily: numerals, fontSize: 13, color: t.muted }}>{data.unit}</span>
      </span>
      <span
        style={{
          fontSize: 11,
          color: delta > 0 && hot ? t.warning : t.faint,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {hoverIndex != null
          ? `at ${timeAt(hoverIndex)}`
          : `${delta >= 0 ? "+" : "−"}${format(Math.abs(delta), data.digits)} vs window mean`}
      </span>
    </div>
  )
}

const Chip = ({ t, children, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      border: `1px solid ${active ? t.ink : t.border}`,
      background: active ? t.chip : "transparent",
      color: t.ink,
      borderRadius: 6,
      padding: "3px 8px",
      fontSize: 12,
      fontFamily: font,
      cursor: "pointer",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </button>
)

const FilterBar = ({ t, data }) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      padding: "8px 0 2px",
      borderTop: `1px solid ${t.grid}`,
    }}
  >
    {data.filters.map(filter => (
      <Chip key={filter} t={t}>
        {filter} ▾
      </Chip>
    ))}
    <button
      type="button"
      style={{
        border: 0,
        background: "transparent",
        color: t.muted,
        fontSize: 12,
        fontFamily: font,
        cursor: "pointer",
      }}
    >
      Reset filters
    </button>
  </div>
)

const MenuItem = ({ t, children, hint, check }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      gap: 16,
      padding: "5px 10px",
      borderRadius: 5,
      fontSize: 12.5,
      color: t.ink,
      cursor: "pointer",
    }}
  >
    <span>
      {check !== undefined && (
        <span style={{ display: "inline-block", width: 16, color: t.series[0] }}>
          {check ? "✓" : ""}
        </span>
      )}
      {children}
    </span>
    {hint && <span style={{ color: t.faint }}>{hint}</span>}
  </div>
)

const MenuLabel = ({ t, children }) => (
  <div style={{ padding: "8px 10px 3px", fontSize: 11, color: t.faint }}>{children}</div>
)

const Divider = ({ t }) => <div style={{ height: 1, background: t.grid, margin: "4px 0" }} />

const MoreMenu = ({ t }) => (
  <div
    style={{
      position: "absolute",
      top: 34,
      right: 0,
      width: 250,
      background: t.hoverBg,
      boxShadow: t.hoverShadow,
      borderRadius: 10,
      padding: 5,
      zIndex: 5,
      fontFamily: font,
    }}
  >
    <MenuLabel t={t}>Navigation</MenuLabel>
    <div style={{ display: "flex", gap: 4, padding: "2px 10px 6px" }}>
      {["Pan", "Select", "Highlight", "Vertical"].map((mode, index) => (
        <span
          key={mode}
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 11.5,
            padding: "4px 0",
            borderRadius: 5,
            background: index === 0 ? t.chip : "transparent",
            border: `1px solid ${index === 0 ? t.ink : t.border}`,
            color: t.ink,
          }}
        >
          {mode}
        </span>
      ))}
    </div>
    <MenuItem t={t} hint="Shift+Alt+wheel">
      Zoom in or out
    </MenuItem>
    <MenuItem t={t} hint="Alt+Shift+R">
      Reset zoom
    </MenuItem>
    <Divider t={t} />
    <MenuItem t={t} check>
      Anomaly strip
    </MenuItem>
    <MenuItem t={t} check>
      Annotations
    </MenuItem>
    <MenuItem t={t} hint="Value, high first">
      Sort dimensions
    </MenuItem>
    <Divider t={t} />
    <MenuItem t={t}>Chart type and display…</MenuItem>
    <MenuItem t={t}>Data and aggregation…</MenuItem>
    <MenuItem t={t}>Download CSV, PNG, PDF…</MenuItem>
    <MenuItem t={t}>Chart info</MenuItem>
    <MenuItem t={t}>Reload data</MenuItem>
  </div>
)

const ZoomChip = ({ t }) => (
  <div
    style={{
      position: "absolute",
      top: 4,
      right: 8,
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: t.hoverBg,
      boxShadow: t.hoverShadow,
      borderRadius: 999,
      padding: "4px 6px 4px 12px",
      fontSize: 12,
      color: t.ink,
      fontFamily: font,
      zIndex: 3,
    }}
  >
    Zoomed to 17:24–17:36
    <button
      type="button"
      style={{
        border: 0,
        borderRadius: 999,
        background: t.ink,
        color: t.panel,
        padding: "3px 10px",
        fontSize: 12,
        fontFamily: font,
        cursor: "pointer",
      }}
    >
      Reset
    </button>
  </div>
)

const LegendLine = ({ t, data, hoverIndex, hidden, onToggle }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
    {data.series.map((s, index) => {
      const value = hoverIndex != null ? s.values[hoverIndex] : s.values[points - 1]
      const off = hidden.has(s.id)
      return (
        <button
          key={s.id}
          type="button"
          onClick={() => onToggle(s.id)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            border: 0,
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            opacity: off ? 0.4 : 1,
            fontFamily: font,
          }}
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
        </button>
      )
    })}
  </div>
)

const Attention = ({ t, data, compact = false, onFocus }) => {
  const ranked = data.series
    .map((s, index) => ({
      ...s,
      color: t.series[index % t.series.length],
      last: s.values[points - 1],
    }))
    .sort((a, b) => b.last - a.last)
  const alert = data.alert
  const firing = alert ? ranked.filter(s => s.last >= alert.warning) : []
  const critical = alert && firing.some(s => s.last >= alert.critical)

  if (!firing.length)
    return (
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
        Within thresholds
      </span>
    )

  const tone = critical ? t.critical : t.warning
  const top = firing[0]
  const since = points - 1 - [...top.values].reverse().findIndex(value => value < alert.warning)

  return (
    <div
      onMouseEnter={() => onFocus(top.id)}
      onMouseLeave={() => onFocus(null)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 3,
        cursor: "default",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: t.panel,
            background: tone,
            borderRadius: 999,
            padding: "2px 8px",
          }}
        >
          {critical ? "Critical" : "Warning"}
        </span>
        <span
          style={{
            fontFamily: numerals,
            fontSize: compact ? 22 : 30,
            fontWeight: 600,
            lineHeight: 1,
            color: tone,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {format(top.last, data.digits)}
        </span>
        <span style={{ fontFamily: numerals, fontSize: 13, color: t.muted }}>{data.unit}</span>
      </span>
      <span style={{ fontSize: 11.5, color: t.muted, whiteSpace: "nowrap" }}>
        <span style={{ color: top.color, fontWeight: 600 }}>{top.id}</span>
        <span>{`${firing.length > 1 ? ` and ${firing.length - 1} more` : ""} above ${alert.warning} since ${timeAt(Math.max(0, since)).slice(0, 5)}`}</span>
      </span>
    </div>
  )
}

export const ModernCard = ({
  theme = "light",
  dataset = "load",
  width = 640,
  height = 190,
  legend: forced,
  zoomed = false,
  filtersOpen = false,
  menuOpen = false,
  actionsVisible = false,
  consumerAction = true,
  headline = "attention",
}) => {
  const t = themes[theme]
  const base = datasets[dataset]
  const [hidden, setHidden] = useState(() => new Set())
  const data = { ...base, series: base.series.filter(s => !hidden.has(s.id)) }
  const [hoverIndex, setHoverIndex] = useState(null)
  const [hovered, setHovered] = useState(false)
  const [showFilters, setShowFilters] = useState(filtersOpen)
  const [showMenu, setShowMenu] = useState(menuOpen)
  const [focusId, setFocusId] = useState(null)
  const id = useMemo(() => `modern-${Math.random().toString(36).slice(2, 8)}`, [])

  const legend = forced || pickLegend({ width, count: base.series.length })
  const side = legend === "table"
  const tile = legend === "hidden"
  const plotWidth = side ? Math.round((width - 28) * 0.6) : width - 28
  const toggle = seriesId =>
    setHidden(current => {
      const next = new Set(current)
      if (next.has(seriesId)) next.delete(seriesId)
      else next.add(seriesId)
      return next
    })

  const actionsShown = actionsVisible || hovered || showMenu
  const bands = base.alert
    ? [
        {
          from: base.alert.warning,
          to: base.alert.critical,
          color: t.warning,
          label: `Warning at ${base.alert.warning}`,
        },
        {
          from: base.alert.critical,
          to: 1e9,
          color: t.critical,
          label: `Critical at ${base.alert.critical}`,
        },
      ]
    : []

  return (
    <section
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width,
        boxSizing: "border-box",
        background: t.panel,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        padding: "14px 14px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        fontFamily: font,
        position: "relative",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
              {base.title}
            </h3>
            <div
              style={{
                display: "flex",
                gap: 0,
                opacity: actionsShown ? 1 : 0,
                transition: "opacity 120ms",
                position: "relative",
              }}
            >
              <span
                onClick={() => setShowFilters(open => !open)}
                style={{ borderRadius: 6, background: showFilters ? t.chip : "transparent" }}
              >
                <Icon path={icons.filter} t={t} label="Filters" />
              </span>
              {consumerAction && (
                <Icon path={extraIcons.dashboard} t={t} label="Add to dashboard" />
              )}
              <Icon path={icons.expand} t={t} label="Full screen" />
              <span
                onClick={() => setShowMenu(open => !open)}
                style={{ borderRadius: 6, background: showMenu ? t.chip : "transparent" }}
              >
                <Icon path={icons.more} t={t} label="More" />
              </span>
              {showMenu && <MoreMenu t={t} />}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(open => !open)}
            style={{
              alignSelf: "flex-start",
              border: 0,
              background: "transparent",
              padding: 0,
              fontSize: 12,
              color: t.faint,
              cursor: "pointer",
              fontFamily: font,
              textAlign: "left",
            }}
          >
            {base.scope}
            {hidden.size > 0 && <span style={{ color: t.warning }}>, {hidden.size} hidden</span>}
          </button>
        </div>
        {headline === "attention" ? (
          <Attention t={t} data={base} compact={tile} onFocus={setFocusId} />
        ) : (
          <Readout t={t} data={base} hoverIndex={hoverIndex} compact={tile} />
        )}
      </header>
      {showFilters && <FilterBar t={t} data={base} />}
      <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
        <div style={{ position: "relative", flex: side ? "0 0 60%" : 1, minWidth: 0 }}>
          {zoomed && <ZoomChip t={t} />}
          <Plot
            t={t}
            data={data}
            width={plotWidth}
            height={height}
            hoverIndex={hoverIndex}
            onHover={setHoverIndex}
            hoverMode={tile ? "tooltip" : "legend"}
            direct={legend === "direct"}
            rightPad={legend === "direct" ? 116 : 8}
            id={id}
            bands={bands}
            anomalies={anomalyRates}
            annotations={base.annotations || []}
            focusId={focusId}
            onFocus={setFocusId}
          />
          {tile && hoverIndex != null && (
            <Tooltip
              t={t}
              data={data}
              hoverIndex={hoverIndex}
              leftPct={(hoverIndex / (points - 1)) * 100}
            />
          )}
        </div>
        {side && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <LegendTable t={t} data={data} hoverIndex={hoverIndex} compact onFocus={setFocusId} />
          </div>
        )}
      </div>
      {!tile && (
        <footer
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          {legend === "below" ? (
            <LegendLine
              t={t}
              data={base}
              hoverIndex={hoverIndex}
              hidden={hidden}
              onToggle={toggle}
            />
          ) : (
            <span />
          )}
          <button
            type="button"
            style={{
              border: 0,
              background: "transparent",
              color: t.muted,
              fontSize: 12,
              fontFamily: font,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Compare, drill down, correlate
          </button>
        </footer>
      )}
    </section>
  )
}
