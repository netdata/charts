import React from "react"
import { themes, font } from "./chartCard"

const W = 200
const H = 110

const tone = {
  light: { track: "#E8ECEC", line: "#EEF1F1", dot: "#DCE2E3" },
  dark: { track: "#1E2424", line: "#1A1F1F", dot: "#283030" },
}

const polar = (cx, cy, r, angle) => [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]

const arc = (cx, cy, r, from, to) => {
  const [x0, y0] = polar(cx, cy, r, from)
  const [x1, y1] = polar(cx, cy, r, to)
  return `M${x0},${y0} A${r},${r} 0 ${to - from > Math.PI ? 1 : 0} 1 ${x1},${y1}`
}

const ring = (cx, cy, r) => arc(cx, cy, r, -Math.PI / 2, Math.PI * 1.4999)

const Pill = ({ x, y, w, h = 4, fill }) => (
  <rect x={x} y={y - h / 2} width={w} height={h} rx={h / 2} fill={fill} />
)

const plot = { left: 26, right: 194, top: 10, bottom: 92 }
const gridYs = [10, 37, 64, 91]

const horizon = (() => {
  const steps = 48
  const coords = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    const y = 58 - 10 * Math.sin(t * Math.PI * 1.6 + 0.6) - 5 * Math.sin(t * Math.PI * 4.2 + 1.1)
    return [plot.left + t * (plot.right - plot.left), y]
  })
  let d = `M${coords[0][0]},${coords[0][1]}`
  for (let i = 1; i < coords.length; i++) d += ` L${coords[i][0]},${coords[i][1]}`
  return { line: d, area: `${d} L${plot.right},${plot.bottom} L${plot.left},${plot.bottom} Z` }
})()

const Outline = ({ type, c }) => {
  if (type === "line")
    return (
      <>
        {gridYs.map(y => (
          <React.Fragment key={y}>
            <line x1={plot.left} x2={plot.right} y1={y} y2={y} stroke={c.line} />
            <Pill x={6} y={y} w={12} fill={c.track} />
          </React.Fragment>
        ))}
        {[34, 74, 114, 154].map(x => (
          <Pill key={x} x={x} y={102} w={16} fill={c.track} />
        ))}
      </>
    )
  if (type === "gauge")
    return (
      <>
        <path
          d={arc(100, 62, 42, Math.PI * 0.75, Math.PI * 2.25)}
          fill="none"
          stroke={c.track}
          strokeWidth={6}
          strokeLinecap="round"
        />
        <Pill x={84} y={62} w={32} h={10} fill={c.track} />
        <Pill x={90} y={78} w={20} fill={c.track} />
      </>
    )
  if (type === "easyPie")
    return (
      <>
        <path d={ring(100, 55, 40)} fill="none" stroke={c.track} strokeWidth={5} />
        <Pill x={84} y={52} w={32} h={10} fill={c.track} />
        <Pill x={90} y={68} w={20} fill={c.track} />
      </>
    )
  if (type === "donut")
    return (
      <>
        <path d={ring(60, 55, 32)} fill="none" stroke={c.track} strokeWidth={12} />
        {[34, 48, 62, 76].map((y, i) => (
          <React.Fragment key={y}>
            <circle cx={118} cy={y} r={3} fill={c.track} />
            <Pill x={126} y={y} w={[44, 36, 48, 30][i]} fill={c.track} />
          </React.Fragment>
        ))}
      </>
    )
  if (type === "heatmap")
    return (
      <>
        {Array.from({ length: 5 }, (_, row) =>
          Array.from({ length: 14 }, (_, col) => (
            <rect
              key={`${row}-${col}`}
              x={8 + col * 13.2}
              y={8 + row * 16}
              width={11.2}
              height={14}
              rx={2}
              fill={c.track}
            />
          ))
        )}
        {[8, 60, 112, 164].map(x => (
          <Pill key={x} x={x} y={100} w={20} fill={c.track} />
        ))}
      </>
    )
  if (type === "number")
    return (
      <>
        <Pill x={58} y={48} w={60} h={18} fill={c.track} />
        <Pill x={124} y={54} w={18} h={6} fill={c.track} />
        <line x1={20} x2={180} y1={86} y2={86} stroke={c.line} strokeWidth={1.5} />
      </>
    )
  return (
    <>
      {[16, 40, 64, 88].map((y, i) => (
        <React.Fragment key={y}>
          <Pill x={8} y={y} w={[70, 56, 64, 48][i]} fill={c.track} />
          <Pill x={162} y={y} w={30} fill={c.track} />
          {i < 3 && <line x1={8} x2={192} y1={y + 12} y2={y + 12} stroke={c.line} />}
        </React.Fragment>
      ))}
    </>
  )
}

const Horizon = ({ type, c, id }) => {
  const gradient = `sk-h-${id}`
  const defs = (
    <defs>
      <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={c.track} stopOpacity="1" />
        <stop offset="1" stopColor={c.track} stopOpacity="0" />
      </linearGradient>
    </defs>
  )
  if (type === "line")
    return (
      <>
        {defs}
        {gridYs.map(y => (
          <line key={y} x1={plot.left} x2={plot.right} y1={y} y2={y} stroke={c.line} />
        ))}
        <path d={horizon.area} fill={`url(#${gradient})`} />
        <path d={horizon.line} fill="none" stroke={c.track} strokeWidth={1.5} />
      </>
    )
  if (type === "heatmap")
    return (
      <>
        {defs}
        <rect x={8} y={8} width={184} height={80} rx={4} fill={`url(#${gradient})`} />
      </>
    )
  if (type === "number")
    return (
      <>
        {defs}
        <Pill x={58} y={36} w={60} h={18} fill={c.track} />
        <path
          d="M20,96 L20,80 C50,74 70,84 100,76 S150,70 180,78 L180,96 Z"
          fill={`url(#${gradient})`}
        />
      </>
    )
  return <Outline type={type} c={c} />
}

const Dots = ({ type, c, id }) => {
  const pattern = `sk-d-${id}`
  const mask = `sk-m-${id}`
  const shape = {
    line: <rect x={8} y={8} width={184} height={88} fill="#fff" />,
    gauge: (
      <path
        d={arc(100, 62, 42, Math.PI * 0.75, Math.PI * 2.25)}
        fill="none"
        stroke="#fff"
        strokeWidth={14}
        strokeLinecap="round"
      />
    ),
    easyPie: <path d={ring(100, 55, 40)} fill="none" stroke="#fff" strokeWidth={12} />,
    donut: <path d={ring(60, 55, 32)} fill="none" stroke="#fff" strokeWidth={18} />,
    heatmap: <rect x={8} y={8} width={184} height={80} fill="#fff" />,
    number: <rect x={56} y={36} width={88} height={26} rx={6} fill="#fff" />,
    table: (
      <>
        {[16, 40, 64, 88].map(y => (
          <rect key={y} x={8} y={y - 4} width={184} height={8} fill="#fff" />
        ))}
      </>
    ),
  }[type]

  return (
    <>
      <defs>
        <pattern id={pattern} width={6} height={6} patternUnits="userSpaceOnUse">
          <circle cx={3} cy={3} r={1} fill={c.dot} />
        </pattern>
        <mask id={mask}>{shape}</mask>
      </defs>
      <rect width={W} height={H} fill={`url(#${pattern})`} mask={`url(#${mask})`} />
      {type === "donut" &&
        [34, 48, 62, 76].map((y, i) => (
          <Pill key={y} x={118} y={y} w={[44, 36, 48, 30][i]} fill={c.track} />
        ))}
    </>
  )
}

const variants = { outline: Outline, horizon: Horizon, dots: Dots }

const types = [
  { type: "line", title: "CPU utilization" },
  { type: "gauge", title: "Disk space" },
  { type: "easyPie", title: "Memory" },
  { type: "donut", title: "Requests by status" },
  { type: "heatmap", title: "Latency distribution" },
  { type: "number", title: "Active connections" },
  { type: "table", title: "Top processes" },
]

export const ideas = [
  {
    id: "outline",
    name: "B1. Chart outline",
    note: "The chart's own anatomy, empty: axis labels as soft pills, gridlines, tracks.",
  },
  {
    id: "horizon",
    name: "B2. Horizon",
    note: "One calm silhouette that fades into the baseline, replacing the jagged squiggle.",
  },
  {
    id: "dots",
    name: "B3. Graph paper",
    note: "A fine dot grid fills the chart's shape. Texture, not a fake value.",
  },
]

const Card = ({ theme, title, children }) => {
  const palette = themes[theme]
  return (
    <div
      style={{
        background: palette.panel,
        border: `1px solid ${palette.border}`,
        borderRadius: 12,
        padding: "12px 12px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        height: 172,
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontFamily: font, fontSize: 13, fontWeight: 500, color: palette.ink }}>
        {title}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  )
}

export const SkeletonMockups = ({ theme = "dark", only }) => {
  const palette = themes[theme]
  const c = tone[theme]
  const shown = only ? ideas.filter(idea => idea.id === only) : ideas

  return (
    <div style={{ background: palette.ground, padding: 24, minHeight: "100vh", fontFamily: font }}>
      {shown.map(idea => {
        const Variant = variants[idea.id]
        return (
          <section key={idea.id} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: palette.ink }}>
                {idea.name}
              </h2>
              <span style={{ fontSize: 13, color: palette.muted }}>{idea.note}</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 8,
              }}
            >
              {types.map(({ type, title }) => (
                <Card key={type} theme={theme} title={title}>
                  <svg
                    viewBox={`0 0 ${W} ${H}`}
                    width="100%"
                    height="100%"
                    style={{ display: "block" }}
                  >
                    <Variant type={type} c={c} id={`${idea.id}-${type}-${theme}`} />
                  </svg>
                </Card>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
