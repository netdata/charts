const MAX_SAMPLES = 500

let enabled = false
const byChart = new Map()
let heapCurrent = null
let heapPeak = null

const getEntry = (chartId, renderer) => {
  const key = `${chartId}:${renderer}`
  let entry = byChart.get(key)
  if (!entry) {
    entry = { renderer, durations: [] }
    byChart.set(key, entry)
  }
  return entry
}

export const setEnabled = value => {
  enabled = value
}

export const isEnabled = () => enabled

export const record = (chartId, renderer, ms) => {
  const { durations } = getEntry(chartId, renderer)
  durations.push(ms)
  if (durations.length > MAX_SAMPLES) durations.shift()
}

export const timeRender = (chartId, renderer, fn) => {
  if (!enabled) return fn()

  const start = performance.now()
  fn()
  record(chartId, renderer, performance.now() - start)
}

export const sampleHeap = () => {
  const memory = performance.memory
  if (!memory) return

  heapCurrent = memory.usedJSHeapSize
  heapPeak = Math.max(heapPeak ?? 0, heapCurrent)
}

const quantile = (sorted, q) => {
  if (!sorted.length) return 0

  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  const next = sorted[base + 1]

  return next !== undefined ? sorted[base] + rest * (next - sorted[base]) : sorted[base]
}

const stats = durations => {
  const sorted = [...durations].sort((a, b) => a - b)

  return {
    count: sorted.length,
    p50: quantile(sorted, 0.5),
    p95: quantile(sorted, 0.95),
    max: sorted.length ? sorted[sorted.length - 1] : 0,
  }
}

export const snapshot = () => {
  const all = []
  const byRenderer = {}

  byChart.forEach(({ renderer, durations }) => {
    all.push(...durations)
    byRenderer[renderer] = (byRenderer[renderer] || []).concat(durations)
  })

  return {
    overall: stats(all),
    renderers: Object.fromEntries(
      Object.entries(byRenderer).map(([renderer, durations]) => [renderer, stats(durations)])
    ),
    heap: { current: heapCurrent, peak: heapPeak, supported: !!performance.memory },
  }
}

export const reset = () => {
  byChart.clear()
  heapCurrent = null
  heapPeak = null
}
