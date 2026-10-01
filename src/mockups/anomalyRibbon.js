import React from "react"
import { wave, makeScales, areaPath, linePath, points, niceTicks, format } from "./primitives"
import { themes, font, timeAt } from "./chartCard"

const numerals = "'IBM Plex Sans Condensed', 'IBM Plex Sans', system-ui, sans-serif"

const noiseFloor = 2

const ramps = {
  dark: { low: [74, 58, 140], high: [196, 160, 255] },
  light: { low: [214, 202, 255], high: [98, 52, 214] },
}

const mix = (a, b, t) => a.map((value, i) => Math.round(value + (b[i] - value) * t))

export const rateColor = (theme, rate, alpha = 1) => {
  const { low, high } = ramps[theme]
  const t = Math.min(1, Math.max(0, (rate - noiseFloor) / 48))
  const [r, g, b] = mix(low, high, Math.sqrt(t))
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const burst = (index, center, width, peak) => {
  const distance = Math.abs(index - center) / width
  return distance > 1 ? 0 : peak * (1 - distance * distance)
}

export const anomalyRates = {
  calm: Array.from({ length: points }, (_, i) => (i % 17 === 0 ? 0.6 : 0)),
  busy: Array.from({ length: points }, (_, i) =>
    Math.max(burst(i, 46, 7, 42), burst(i, 90, 3, 12), i % 13 === 0 ? 0.8 : 0)
  ),
}

const series = [
  { name: "user", color: 1, values: wave({ center: 24, amplitude: 3, cycles: 6, seed: 2 }) },
  { name: "system", color: 2, values: wave({ center: 9, amplitude: 1.4, cycles: 6, seed: 5 }) },
]

export const getRuns = rates => {
  const runs = []
  rates.forEach((rate, index) => {
    if (rate < noiseFloor) return
    const last = runs[runs.length - 1]
    if (last && last.to === index - 1) {
      last.to = index
      last.peak = Math.max(last.peak, rate)
      if (rate === last.peak) last.peakAt = index
    } else runs.push({ from: index, to: index, peak: rate, peakAt: index })
  })
  return runs
}

const width = 640
const height = 210
const pad = [34, 14, 26, 36]

const Pill = ({ theme, runs }) => {
  const peak = Math.max(...runs.map(run => run.peak))
  return (
    <span
      title={`${runs.length} anomalous period${runs.length > 1 ? "s" : ""} in this window`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11.5,
        fontWeight: 600,
        padding: "2px 9px",
        borderRadius: 999,
        color: theme === "dark" ? "#0F0B1D" : "#FFFFFF",
        background: rateColor(theme, peak),
        fontFamily: numerals,
      }}
    >
      Anomalous, peak {format(peak, 0)}%
    </span>
  )
}

const Tide = ({ theme, rates, scales }) => {
  const runs = getRuns(rates)
  const band = 22
  const top = scales.plot.top - band - 4
  const y = rate => top + band - (Math.max(0, rate - noiseFloor) / 48) * band
  const visible = rates.map(rate => (rate < noiseFloor ? noiseFloor : rate))
  const id = `tide-${theme}`

  if (!runs.length) return null

  const d = `${visible
    .map((rate, i) => `${i ? "L" : "M"}${scales.x(i)},${y(rate)}`)
    .join(" ")} L${scales.x(points - 1)},${top + band} L${scales.x(0)},${top + band} Z`

  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
          {rates.map((rate, i) => (
            <stop
              key={i}
              offset={`${(i / (points - 1)) * 100}%`}
              stopColor={rateColor(theme, rate, rate < noiseFloor ? 0 : 0.9)}
            />
          ))}
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
      {runs.map(run => (
        <text
          key={run.from}
          x={scales.x(run.peakAt)}
          y={y(run.peak) - 4}
          textAnchor="middle"
          fontSize={11}
          fontWeight={600}
          fontFamily={numerals}
          fill={rateColor(theme, run.peak)}
        >
          {format(run.peak, 0)}%
        </text>
      ))}
    </g>
  )
}

const Shade = ({ theme, rates, scales }) => (
  <g>
    {rates.map((rate, i) =>
      rate < noiseFloor ? null : (
        <rect
          key={i}
          x={scales.x(i) - (scales.x(1) - scales.x(0)) / 2}
          width={scales.x(1) - scales.x(0) + 1.5}
          y={scales.plot.top}
          height={scales.plot.bottom - scales.plot.top}
          fill={rateColor(theme, rate, 0.08 + (rate / 50) * 0.32)}
        />
      )
    )}
    {rates.map((rate, i) =>
      rate < noiseFloor ? null : (
        <rect
          key={`edge-${i}`}
          x={scales.x(i) - (scales.x(1) - scales.x(0)) / 2}
          width={scales.x(1) - scales.x(0) + 1.5}
          y={scales.plot.top - 3}
          height={3}
          fill={rateColor(theme, rate)}
        />
      )
    )}
  </g>
)

const Runs = ({ t, theme, rates, scales }) => {
  const runs = getRuns(rates)
  const base = scales.plot.top - 8
  return (
    <g>
      {runs.map(run => {
        const thickness = 3 + (Math.min(run.peak, 50) / 50) * 6
        const x0 = scales.x(run.from) - 2
        const x1 = scales.x(run.to) + 2
        return (
          <g key={run.from}>
            <rect
              x={x0}
              y={base - thickness / 2}
              width={Math.max(6, x1 - x0)}
              height={thickness}
              rx={thickness / 2}
              fill={rateColor(theme, run.peak)}
            />
            <text
              x={(x0 + x1) / 2}
              y={base - thickness / 2 - 5}
              textAnchor="middle"
              fontSize={11}
              fontFamily={numerals}
              fontWeight={600}
              fill={t.ink}
            >
              {format(run.peak, 0)}%
              <tspan fill={t.muted} fontWeight={400}>
                {` ${timeAt(run.from).slice(0, 5)}–${timeAt(run.to).slice(0, 5)}`}
              </tspan>
            </text>
          </g>
        )
      })}
    </g>
  )
}

const QuietStrip = ({ theme, rates, scales }) => (
  <g>
    {rates.map((rate, i) =>
      rate < noiseFloor ? null : (
        <rect
          key={i}
          x={scales.x(i) - 1}
          y={scales.plot.top - 7}
          width={Math.max(2, scales.x(1) - scales.x(0) - 1)}
          height={4}
          rx={1}
          fill={rateColor(theme, rate)}
        />
      )
    )}
  </g>
)

const variants = {
  tide: { label: "A. Tide", Ribbon: Tide, pill: false },
  shade: { label: "B. Shade", Ribbon: Shade, pill: true },
  runs: { label: "C. Runs", Ribbon: Runs, pill: false },
  quiet: { label: "D. Quiet", Ribbon: QuietStrip, pill: true, hoverOnly: true },
}

export const AnomalyCard = ({ theme = "dark", variant = "tide", rates, hovered = false }) => {
  const t = themes[theme]
  const { Ribbon, pill, hoverOnly } = variants[variant]
  const runs = getRuns(rates)
  const stacked = series.map((_, i) =>
    series[0].values.map((__, index) =>
      series.slice(i).reduce((sum, s) => sum + s.values[index], 0)
    )
  )
  const max = Math.max(...stacked[0]) * 1.1
  const scales = makeScales({ width, height, min: 0, max, pad })
  const ticks = niceTicks(0, max, 3)

  return (
    <section
      style={{
        width,
        background: t.panel,
        border: `1px solid ${hovered ? t.border : "transparent"}`,
        borderRadius: 12,
        fontFamily: font,
        padding: "12px 0 6px",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          minHeight: 22,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: t.ink }}>
          Total CPU utilization
          <span style={{ fontWeight: 400, color: t.muted, marginLeft: 8, fontSize: 12 }}>
            system.cpu
          </span>
        </span>
        {pill && runs.length > 0 && <Pill theme={theme} runs={runs} />}
      </header>
      <svg width={width} height={height} style={{ display: "block" }}>
        {ticks.map(tick => (
          <g key={tick}>
            <line
              x1={scales.plot.left}
              x2={scales.plot.right}
              y1={scales.y(tick)}
              y2={scales.y(tick)}
              stroke={t.grid}
            />
            <text
              x={scales.plot.left - 8}
              y={scales.y(tick) + 4}
              textAnchor="end"
              fontSize={11}
              fill={t.faint}
              fontFamily={numerals}
            >
              {tick}
            </text>
          </g>
        ))}
        {stacked.map((values, i) => (
          <g key={series[i].name}>
            <path
              d={areaPath(values, scales, 0)}
              fill={t.series[series[i].color]}
              fillOpacity={0.55}
            />
            <path
              d={linePath(values, scales)}
              fill="none"
              stroke={t.series[series[i].color]}
              strokeWidth={1.5}
            />
          </g>
        ))}
        {(!hoverOnly || hovered) && <Ribbon t={t} theme={theme} rates={rates} scales={scales} />}
        {[0, 40, 80, 119].map(index => (
          <text
            key={index}
            x={scales.x(index)}
            y={height - 6}
            textAnchor={index === 119 ? "end" : index === 0 ? "start" : "middle"}
            fontSize={11}
            fill={t.faint}
            fontFamily={numerals}
          >
            {timeAt(index)}
          </text>
        ))}
      </svg>
    </section>
  )
}

export const AnomalyRibbonMockups = ({ theme = "dark" }) => {
  const t = themes[theme]
  const caption = { fontSize: 13, color: t.muted, margin: "0 0 8px", fontFamily: font }
  const notes = {
    tide: "The anomaly rate is a small area of its own above the plot. Height and brightness both follow the rate; the peak is labelled.",
    shade:
      "Anomalous periods are shaded behind the lines, stronger with the rate. A pill in the header gives the peak.",
    runs: "Consecutive anomalous points merge into one run. Thicker and brighter for a higher peak, labelled with peak and time.",
    quiet:
      "Nothing on the plot at rest; the header pill says it happened. The strip appears on hover.",
  }

  return (
    <div
      style={{
        background: t.ground,
        minHeight: "100vh",
        padding: 28,
        boxSizing: "border-box",
        display: "grid",
        gridTemplateColumns: "repeat(2, max-content)",
        gap: "24px 28px",
      }}
    >
      {Object.entries(variants).map(([key, { label, hoverOnly }]) => (
        <React.Fragment key={key}>
          <div>
            <p style={caption}>
              <strong style={{ color: t.ink }}>{label}</strong> with anomalies. {notes[key]}
            </p>
            <AnomalyCard theme={theme} variant={key} rates={anomalyRates.busy} />
            {hoverOnly && (
              <>
                <p style={{ ...caption, marginTop: 12 }}>Same card on hover</p>
                <AnomalyCard theme={theme} variant={key} rates={anomalyRates.busy} hovered />
              </>
            )}
          </div>
          <div>
            <p style={caption}>
              <strong style={{ color: t.ink }}>{label}</strong> with only noise below {noiseFloor}%:
              no ink at all
            </p>
            <AnomalyCard theme={theme} variant={key} rates={anomalyRates.calm} />
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}
