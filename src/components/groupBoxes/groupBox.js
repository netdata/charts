import React, { useRef, useLayoutEffect, Fragment, useState, useMemo } from "react"
import styled from "styled-components"
import { useChart, useAttributeValue, useIsModern } from "@/components/provider"
import { modernBoxOptions } from "@/components/modern/groupBoxes/scale"
import useTransition from "@/components/helpers/useEffectWithTransition"
import drawBoxes from "./drawBoxes"
import useGroupBoxRowData from "./useGroupBoxRowData"
import Popover from "./popover"

const Track = styled.div`
  flex: 1 1 0;
  min-width: 0;
`

// Modern rows let the boxes use the width left next to the group label.
const useTrackWidth = (trackRef, enabled) => {
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    if (!enabled || !trackRef.current) return

    const measure = () => setWidth(trackRef.current?.clientWidth || 0)
    measure()

    if (typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver(measure)
    observer.observe(trackRef.current)
    return () => observer.disconnect()
  }, [enabled])

  return enabled ? width : 0
}

const GroupBox = ({ uiName, dimensions, groupLabel, ...options }) => {
  const chart = useChart()

  const dimensionsRef = useRef()
  const canvasRef = useRef()
  const boxesRef = useRef()

  const [hover, setHover] = useState(null)

  const boxHoverRef = useRef(-1)
  const timeoutId = useRef()

  const isModern = useIsModern()

  const trackRef = useRef()
  const trackWidth = useTrackWidth(trackRef, isModern)
  const trackWidthRef = useRef(trackWidth)
  trackWidthRef.current = trackWidth

  const closeDrop = () =>
    requestAnimationFrame(() => {
      setHover(currentHover => {
        if (boxHoverRef.current === -1 || boxHoverRef.current !== currentHover?.index) {
          boxesRef.current.deactivateBox()
          boxHoverRef.current = -1
          return null
        }
        return currentHover
      })
    })

  useLayoutEffect(() => {
    boxesRef.current = drawBoxes(
      chart,
      canvasRef.current,
      {
        onMouseenter: ({ index, ...rect }) => {
          boxHoverRef.current = index
          boxesRef.current.activateBox(index)
          timeoutId.current = setTimeout(() => {
            setHover({
              target: { getBoundingClientRect: () => rect },
              index,
            })
          }, 100)
        },
        onMouseout: () => {
          boxHoverRef.current = -1
          clearTimeout(timeoutId.current)
          closeDrop()
        },
        onClick: ({ index, ...rect } = {}) => {
          boxHoverRef.current = index
          boxesRef.current.activateBox(index)
          timeoutId.current = setTimeout(() => {
            setHover({
              target: { getBoundingClientRect: () => rect },
              index,
            })
          }, 100)
        },
      },
      isModern
        ? { ...modernBoxOptions(chart), getAvailableWidth: () => trackWidthRef.current, ...options }
        : options
    )
    return () => boxesRef.current.clear()
  }, [isModern])

  const pointData = useGroupBoxRowData(uiName)

  const [, startTransitionEffect, stopTransitionEffect] = useTransition()

  const theme = useAttributeValue("theme")
  const threshold = useAttributeValue("groupBoxesThreshold")

  useLayoutEffect(() => {
    startTransitionEffect(function* () {
      if (
        hover &&
        dimensionsRef.current &&
        dimensionsRef.current[hover.index] !== dimensions[hover.index]
      ) {
        boxesRef.current.deactivateBox()
        setHover(null)
        boxHoverRef.current = -1
      }
      dimensionsRef.current = dimensions
      yield* boxesRef.current.update(dimensions, pointData)
    })

    return () => stopTransitionEffect()
  }, [
    pointData,
    startTransitionEffect,
    stopTransitionEffect,
    theme,
    isModern,
    threshold,
    trackWidth,
  ])

  const label = useMemo(() => {
    if (!hover) return

    const labels = dimensions[hover.index].split(",")
    return labels[labels.length - 1]
  }, [dimensions[hover?.index]])

  return (
    <Fragment>
      {isModern ? (
        <Track data-testid="groupBox-track" ref={trackRef}>
          <canvas data-testid="groupBox" ref={canvasRef} />
        </Track>
      ) : (
        <canvas data-testid="groupBox" ref={canvasRef} />
      )}
      {hover && (
        <Popover
          target={hover.target}
          label={label}
          groupLabel={groupLabel}
          data={pointData}
          id={dimensions[hover.index]}
        />
      )}
    </Fragment>
  )
}

export default GroupBox
