import React from "react"

export const points = 120

export const wave = ({ center, amplitude, cycles = 2, phase = 0, noise = 0.12, seed = 1 }) =>
  Array.from({ length: points }, (_, index) => {
    const t = index / (points - 1)
    const primary = Math.sin(t * Math.PI * 2 * cycles + phase)
    const secondary = Math.sin(t * Math.PI * 2 * cycles * 3.7 + phase * 1.9)
    const jitter = Math.sin((index + 1) * 12.9898 * seed) * 43758.5453
    const grain = (jitter - Math.floor(jitter) - 0.5) * 2
    return center + amplitude * (primary + secondary * 0.25 + grain * noise)
  })

export const withStep = (values, from, delta) =>
  values.map((value, index) => (index >= from ? value + delta : value))

export const stats = values => {
  const last = values[values.length - 1]
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return { last, mean, min: Math.min(...values), max: Math.max(...values) }
}

export const timeLabels = ["14:25", "14:30", "14:35", "14:40", "14:45", "14:50"]

const scale = (d0, d1, r0, r1) => value => r0 + ((value - d0) / (d1 - d0 || 1)) * (r1 - r0)

const smoothPath = coords => {
  if (!coords.length) return ""
  let d = `M${coords[0][0]},${coords[0][1]}`
  for (let i = 0; i < coords.length - 1; i++) {
    const [x0, y0] = coords[i - 1] || coords[i]
    const [x1, y1] = coords[i]
    const [x2, y2] = coords[i + 1]
    const [x3, y3] = coords[i + 2] || coords[i + 1]
    const c1x = x1 + (x2 - x0) / 6
    const c1y = y1 + (y2 - y0) / 6
    const c2x = x2 - (x3 - x1) / 6
    const c2y = y2 - (y3 - y1) / 6
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${x2},${y2}`
  }
  return d
}

export const makeScales = ({ width, height, min, max, pad = [0, 0, 0, 0] }) => {
  const [top, right, bottom, left] = pad
  return {
    x: scale(0, points - 1, left, width - right),
    y: scale(min, max, height - bottom, top),
    plot: { top, right: width - right, bottom: height - bottom, left },
  }
}

export const linePath = (values, { x, y }) => smoothPath(values.map((v, i) => [x(i), y(v)]))

export const areaPath = (values, scales, baseline) => {
  const line = linePath(values, scales)
  const base = scales.y(baseline)
  return `${line} L${scales.x(values.length - 1)},${base} L${scales.x(0)},${base} Z`
}

export const niceTicks = (min, max, count = 4) => {
  const raw = (max - min) / count
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map(m => m * magnitude).find(s => s >= raw)
  const ticks = []
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(+v.toFixed(6))
  return ticks
}

export const Gradient = ({ id, color, from = 0.45, to = 0, vertical = true }) => (
  <linearGradient id={id} x1="0" y1="0" x2={vertical ? "0" : "1"} y2={vertical ? "1" : "0"}>
    <stop offset="0%" stopColor={color} stopOpacity={from} />
    <stop offset="100%" stopColor={color} stopOpacity={to} />
  </linearGradient>
)

export const Sparkline = ({ values, color, width = 120, height = 32, fill = true, id }) => {
  const { min, max } = stats(values)
  const scales = makeScales({ width, height, min: min - (max - min) * 0.1, max, pad: [2, 3, 0, 0] })
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <Gradient id={id} color={color} from={0.35} />
      </defs>
      {fill && <path d={areaPath(values, scales, min - (max - min) * 0.1)} fill={`url(#${id})`} />}
      <path
        d={linePath(values, scales)}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export const polar = (cx, cy, r, angle) => [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]

export const arcPath = (cx, cy, r, a0, a1) => {
  const [x0, y0] = polar(cx, cy, r, a0)
  const [x1, y1] = polar(cx, cy, r, a1)
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1}`
}

export const fontsHref =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap"

export const FontLink = () => <link rel="stylesheet" href={fontsHref} />

export const format = (value, digits = 1) =>
  value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })

export const dashboardData = (() => {
  const cpuUser = withStep(wave({ center: 34, amplitude: 8, cycles: 3, seed: 2 }), 92, 22)
  const cpuSystem = withStep(
    wave({ center: 14, amplitude: 4, cycles: 4, phase: 1, seed: 3 }),
    92,
    9
  )
  const netIn = wave({ center: 1.24, amplitude: 0.32, cycles: 2.4, seed: 4 })
  const load = withStep(wave({ center: 3.1, amplitude: 0.6, cycles: 1.5, seed: 5 }), 92, 2.2)
  const memory = wave({ center: 71, amplitude: 3, cycles: 1.2, seed: 6, noise: 0.05 })
  const disks = [
    { id: "nvme0n1", values: wave({ center: 420, amplitude: 160, cycles: 3.2, seed: 7 }) },
    {
      id: "nvme1n1",
      values: wave({ center: 310, amplitude: 120, cycles: 2.6, phase: 1.2, seed: 8 }),
    },
    { id: "sda", values: wave({ center: 120, amplitude: 60, cycles: 4.1, phase: 2, seed: 9 }) },
    { id: "sdb", values: wave({ center: 60, amplitude: 25, cycles: 3.6, phase: 0.4, seed: 10 }) },
  ]
  const services = [
    {
      id: "nginx",
      segments: [
        ["ok", 0.62],
        ["warning", 0.08],
        ["ok", 0.3],
      ],
    },
    {
      id: "postgres",
      segments: [
        ["ok", 0.77],
        ["critical", 0.09],
        ["warning", 0.06],
        ["ok", 0.08],
      ],
    },
    { id: "redis", segments: [["ok", 1]] },
    {
      id: "kafka",
      segments: [
        ["ok", 0.4],
        ["off", 0.12],
        ["ok", 0.48],
      ],
    },
  ]
  const filesystems = [
    { id: "/", used: 71 },
    { id: "/var/lib/postgresql", used: 88 },
    { id: "/var/log", used: 43 },
    { id: "/home", used: 22 },
    { id: "/boot", used: 94 },
  ]
  return { cpuUser, cpuSystem, netIn, load, memory, disks, services, filesystems }
})()
