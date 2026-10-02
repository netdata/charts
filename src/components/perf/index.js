import React, { useEffect, useState } from "react"
import { snapshot, reset } from "@/sdk/plugins/perfMonitor/registry"

const boxStyle = {
  position: "fixed",
  top: "8px",
  right: "8px",
  zIndex: 2147483647,
  padding: "8px 10px",
  background: "rgba(0, 0, 0, 0.82)",
  color: "#fff",
  font: "11px/1.5 monospace",
  borderRadius: "4px",
  pointerEvents: "auto",
  minWidth: "200px",
}

const buttonStyle = {
  marginRight: "6px",
  marginTop: "6px",
  font: "11px monospace",
  cursor: "pointer",
}

const ms = n => `${n.toFixed(1)}ms`
const mb = n => (n == null ? "n/a" : `${(n / 1048576).toFixed(1)}MB`)

const PerfOverlay = () => {
  const [snap, setSnap] = useState(snapshot)

  useEffect(() => {
    const id = setInterval(() => setSnap(snapshot()), 500)
    return () => clearInterval(id)
  }, [])

  const { overall, renderers, heap } = snap

  const copy = () => navigator.clipboard?.writeText(JSON.stringify(snapshot(), null, 2))

  return (
    <div style={boxStyle} data-testid="perfOverlay">
      <div>renders: {overall.count}</div>
      <div>
        p50 {ms(overall.p50)} · p95 {ms(overall.p95)} · max {ms(overall.max)}
      </div>
      {Object.entries(renderers).map(([name, s]) => (
        <div key={name} data-testid={`perf-renderer-${name}`}>
          {name}: {s.count} · p95 {ms(s.p95)}
        </div>
      ))}
      <div>heap: {heap.supported ? `${mb(heap.current)} (peak ${mb(heap.peak)})` : "n/a"}</div>
      <button type="button" style={buttonStyle} onClick={reset} data-testid="perf-reset">
        reset
      </button>
      <button type="button" style={buttonStyle} onClick={copy} data-testid="perf-copy">
        copy
      </button>
    </div>
  )
}

export default PerfOverlay
