import React from "react"
import { format } from "./primitives"
import { themes, font, timeAt } from "./chartCard"
import { AnomalyCard, anomalyRates, rateColor } from "./anomalyRibbon"

const numerals = "'IBM Plex Sans Condensed', 'IBM Plex Sans', system-ui, sans-serif"

const iconPath =
  "M13.228 3.29597L8.522 0.578973C8.167 0.373973 7.771 0.271973 7.375 0.271973C6.979 0.271973 6.583 0.373973 6.228 0.578973L1.522 3.29597C0.812 3.70597 0.375 4.46297 0.375 5.28297V10.718C0.375 11.537 0.812 12.295 1.522 12.704L6.228 15.421C6.583 15.626 6.979 15.728 7.375 15.728C7.771 15.728 8.167 15.626 8.522 15.421L13.228 12.704C13.938 12.294 14.375 11.537 14.375 10.718V5.28297C14.375 4.46297 13.938 3.70597 13.228 3.29597ZM7.97949 4.76094L7.37505 3.23265L6.7706 4.76094L4.93313 9.40688H4.37505H1.37505V10.7069H4.37505H5.37505H5.81696L5.97949 10.2959L7.37505 6.76735L8.7706 10.2959L9.26618 11.549L9.93839 10.3811L10.375 9.62253L10.8117 10.3811L10.9992 10.7069H11.375H13.375V9.40688H11.7509L10.9384 7.99531L10.375 7.01662L9.8117 7.99531L9.48391 8.56479L7.97949 4.76094Z"

const rates = anomalyRates.busy
const secondsPerPoint = 15

const getRuns = values => {
  const runs = []
  values.forEach((rate, index) => {
    if (rate <= 0) return
    const last = runs[runs.length - 1]
    if (last && last.to === index - 1) {
      last.to = index
      if (rate > last.peak) Object.assign(last, { peak: rate, peakAt: index })
    } else runs.push({ from: index, to: index, peak: rate, peakAt: index })
  })
  return runs
}

const runs = getRuns(rates)
const worst = runs.reduce((a, b) => (b.peak > a.peak ? b : a), runs[0])
const anomalousMinutes = Math.round((rates.filter(rate => rate > 0).length * secondsPerPoint) / 60)

const Badge = ({ t, theme, scales, wide = false, active = false }) => (
  <button
    type="button"
    title="Anomalies in this window"
    style={{
      position: "absolute",
      left: scales.plot.left - 30,
      top: scales.plot.top - 18,
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: wide ? "2px 8px 2px 5px" : 3,
      borderRadius: 999,
      border: `1px solid ${active ? rateColor(theme, worst.peak) : "transparent"}`,
      background: active ? t.chip : "transparent",
      cursor: "pointer",
      fontFamily: numerals,
      fontSize: 11.5,
      fontWeight: 600,
      color: rateColor(theme, worst.peak),
    }}
  >
    <svg width={13} height={14} viewBox="0 0 15 16">
      <path d={iconPath} fill={rateColor(theme, worst.peak)} fillRule="evenodd" />
    </svg>
    {wide && <span>{`${format(worst.peak, 0)}%`}</span>}
  </button>
)

const Tooltip = ({ t, scales }) => (
  <div
    style={{
      position: "absolute",
      left: scales.plot.left - 30,
      top: scales.plot.top + 8,
      width: 260,
      padding: "10px 12px",
      borderRadius: 10,
      background: t.hoverBg,
      boxShadow: t.hoverShadow,
      fontFamily: font,
      fontSize: 12.5,
      color: t.ink,
      lineHeight: 1.45,
      zIndex: 2,
    }}
  >
    <div style={{ fontWeight: 600 }}>
      Anomalous {runs.length} {runs.length === 1 ? "time" : "times"} in this window
    </div>
    <div style={{ color: t.muted, fontFamily: numerals }}>
      Peak {format(worst.peak, 0)}% at {timeAt(worst.peakAt).slice(0, 5)}, about {anomalousMinutes}{" "}
      min in total
    </div>
    <div style={{ marginTop: 8, color: t.muted, fontSize: 12 }}>
      Click to find what else changed between {timeAt(worst.from).slice(0, 5)} and{" "}
      {timeAt(worst.to).slice(0, 5)}
    </div>
  </div>
)

const correlated = [
  { name: "system.io pressure", score: 0.92 },
  { name: "disk.await sda", score: 0.81 },
  { name: "apps.cpu postgres", score: 0.74 },
]

const CorrelateDrawer = ({ t, theme }) => (
  <div
    style={{
      width: 640,
      marginTop: 8,
      background: t.panel,
      borderRadius: 12,
      padding: "12px 16px",
      fontFamily: font,
      boxSizing: "border-box",
    }}
  >
    <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: t.muted }}>
      <span>Compare</span>
      <span>Drill down</span>
      <span style={{ color: t.ink, fontWeight: 600 }}>Correlate</span>
      <span style={{ marginLeft: "auto", fontFamily: numerals }}>
        Selected area {timeAt(worst.from).slice(0, 5)}–{timeAt(worst.to).slice(0, 5)}
      </span>
    </div>
    {correlated.map(item => (
      <div
        key={item.name}
        style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, fontSize: 12.5 }}
      >
        <span style={{ width: 170, color: t.ink }}>{item.name}</span>
        <span
          style={{
            height: 6,
            width: `${item.score * 300}px`,
            borderRadius: 3,
            background: rateColor(theme, item.score * 50),
          }}
        />
        <span style={{ color: t.muted, fontFamily: numerals }}>{format(item.score, 2)}</span>
      </div>
    ))}
  </div>
)

export const AnomalyBadgeMockups = ({ theme = "dark" }) => {
  const t = themes[theme]
  const caption = { fontSize: 13, color: t.muted, margin: "0 0 8px", fontFamily: font }
  const card = props => (
    <AnomalyCard theme={theme} variant="shade" rates={rates} floor={0} {...props} />
  )

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
      <div>
        <p style={caption}>
          <strong style={{ color: t.ink }}>At rest.</strong> The badge takes the colour of the
          window&apos;s peak rate; it is absent when there are no anomalies.
        </p>
        {card({ overlay: ({ scales }) => <Badge t={t} theme={theme} scales={scales} /> })}
      </div>
      <div>
        <p style={caption}>
          <strong style={{ color: t.ink }}>At rest, wide chart.</strong> The badge grows into a
          short pill with the peak.
        </p>
        {card({ overlay: ({ scales }) => <Badge t={t} theme={theme} scales={scales} wide /> })}
      </div>
      <div>
        <p style={caption}>
          <strong style={{ color: t.ink }}>Hover the badge.</strong> Summary tooltip; anomalous
          periods are spotlit and the rest of the plot dims.
        </p>
        {card({
          hovered: true,
          spotlight: true,
          overlay: ({ scales }) => (
            <>
              <Badge t={t} theme={theme} scales={scales} wide active />
              <Tooltip t={t} scales={scales} />
            </>
          ),
        })}
      </div>
      <div>
        <p style={caption}>
          <strong style={{ color: t.ink }}>Click the badge.</strong> The drawer opens on Correlate
          for the worst anomalous period.
        </p>
        {card({
          hovered: true,
          overlay: ({ scales }) => <Badge t={t} theme={theme} scales={scales} wide active />,
        })}
        <CorrelateDrawer t={t} theme={theme} />
      </div>
    </div>
  )
}
