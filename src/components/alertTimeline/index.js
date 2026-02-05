import React, { useRef, useCallback, memo } from "react"
import styled, { keyframes } from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import { useHeadlessChart } from "@/components/headlessChart"
import { usePlotArea } from "@/components/provider"

const colorMap = {
  WARNING: "#FFC300",
  CRITICAL: "#FF4136",
  CLEAR: "#00AB44",
}

const DEFAULT_HOVER_COLOR = "#808080"

const Container = styled(Flex)`
  position: relative;
  height: 16px;
  cursor: crosshair;
`

const Segment = styled.div`
  position: absolute;
  height: 4px;
  top: 50%;
  transform: translateY(-50%);
`

const Dot = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid ${({ theme }) => theme.colors.mainBackground};
  box-sizing: border-box;
  z-index: 1;
`

const pulse = keyframes`
  0% {
    opacity: 1;
    box-shadow: 0 0 4px 1px var(--pulse-color);
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 8px 3px var(--pulse-color);
  }
  100% {
    opacity: 1;
    box-shadow: 0 0 4px 1px var(--pulse-color);
  }
`

const HoverIndicator = styled.div`
  position: absolute;
  width: 2px;
  height: 100%;
  background: var(--pulse-color);
  top: 0;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 2;
  border-radius: 1px;
  animation: ${pulse} 1.2s ease-in-out infinite;
`

const parseTimestamp = timestamp => {
  if (typeof timestamp === "number") return timestamp * 1000
  return new Date(timestamp).getTime()
}

const AlertTimeline = () => {
  const containerRef = useRef(null)
  const { chart, hover, helpers, attributes } = useHeadlessChart()
  const { left: plotLeft, width: plotWidth } = usePlotArea()
  const { transitions = [], showCleared = true } =
    chart.getAttribute("overlays")?.alertTransitions || {}
  const after = attributes.after
  const before = attributes.before
  const now = Date.now()

  const viewStart = after < 0 ? now + after * 1000 : after * 1000
  const viewEnd = before <= 0 ? now : before * 1000
  const viewDuration = viewEnd - viewStart

  const getPositionPercent = useCallback(
    timestampMs => {
      if (viewDuration <= 0) return 0
      return ((timestampMs - viewStart) / viewDuration) * 100
    },
    [viewStart, viewDuration]
  )

  const sortedTransitions = [...transitions].sort(
    (a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp)
  )

  const segments = []
  const dots = []

  sortedTransitions.forEach((transition, index) => {
    const startMs = parseTimestamp(transition.timestamp)
    const nextTransition = sortedTransitions[index + 1]
    const endMs = nextTransition ? parseTimestamp(nextTransition.timestamp) : viewEnd

    if (endMs < viewStart || startMs > viewEnd) return

    const state = transition.to.toUpperCase()
    const color = colorMap[state]

    if (!color) return
    if (!showCleared && state === "CLEAR") return

    const clampedStart = Math.max(viewStart, startMs)
    const clampedEnd = Math.min(viewEnd, endMs)

    const leftPercent = getPositionPercent(clampedStart)
    const rightPercent = getPositionPercent(clampedEnd)
    const widthPercent = rightPercent - leftPercent

    segments.push({
      key: `segment-${index}`,
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      color,
    })

    if (startMs >= viewStart && startMs <= viewEnd) {
      dots.push({
        key: `dot-${index}`,
        left: `${getPositionPercent(startMs)}%`,
        color,
      })
    }
  })

  const hoverTimestamp = hover?.[0] ?? null
  const hoverPercent = hoverTimestamp ? getPositionPercent(hoverTimestamp) : null

  const getColorAtTimestamp = timestamp => {
    if (!timestamp) return DEFAULT_HOVER_COLOR

    for (let i = sortedTransitions.length - 1; i >= 0; i--) {
      const transition = sortedTransitions[i]
      const transitionMs = parseTimestamp(transition.timestamp)
      if (timestamp >= transitionMs) {
        const state = transition.to.toUpperCase()
        if (!showCleared && state === "CLEAR") return DEFAULT_HOVER_COLOR
        return colorMap[state] || DEFAULT_HOVER_COLOR
      }
    }
    return DEFAULT_HOVER_COLOR
  }

  const hoverColor = getColorAtTimestamp(hoverTimestamp)

  const handleMouseMove = useCallback(
    event => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = event.clientX - rect.left
      const percent = x / rect.width
      const timestamp = viewStart + percent * viewDuration

      chart.sdk.trigger("highlightHover", chart, timestamp, null)
      chart.trigger("highlightHover", timestamp, null)
    },
    [chart, viewStart, viewDuration]
  )

  const handleMouseLeave = useCallback(() => {
    chart.sdk.trigger("highlightBlur", chart)
    chart.trigger("highlightBlur")
  }, [chart])

  return (
    <Container
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ marginLeft: plotLeft, width: plotWidth }}
    >
      {segments.map(segment => (
        <Segment
          key={segment.key}
          style={{
            left: segment.left,
            width: segment.width,
            backgroundColor: segment.color,
          }}
        />
      ))}
      {dots.map(dot => (
        <Dot
          key={dot.key}
          style={{
            left: dot.left,
            backgroundColor: dot.color,
          }}
        />
      ))}
      {hoverPercent !== null && hoverPercent >= 0 && hoverPercent <= 100 && (
        <HoverIndicator style={{ left: `${hoverPercent}%`, "--pulse-color": hoverColor }} />
      )}
    </Container>
  )
}

export default memo(AlertTimeline)
