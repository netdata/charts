import React, { useRef, useLayoutEffect, Fragment, useState, useMemo } from "react"
import { useChart } from "@/components/provider"
import useTransition from "@/components/helpers/useEffectWithTransition"
import drawBoxes from "./drawBoxes"
import useGroupBoxRowData from "./useGroupBoxRowData"
import Popover from "./popover"

const GroupBox = ({ dimensions, getColor, groupIndex, groupLabel, ...options }) => {
  const chart = useChart()

  const dimensionsRef = useRef()
  const canvasRef = useRef()
  const boxesRef = useRef()

  const [hover, setHover] = useState(null)

  const boxHoverRef = useRef(-1)
  const timeoutId = useRef()

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
              rect,
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
              rect,
            })
          }, 100)
        },
      },
      options
    )
    return () => boxesRef.current.clear()
  }, [])

  const pointData = useGroupBoxRowData()

  const [, startTransitionEffect, stopTransitionEffect] = useTransition()

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
      yield* boxesRef.current.update(dimensions, getColor, pointData)
    })

    return () => stopTransitionEffect()
  }, [pointData, getColor, startTransitionEffect, stopTransitionEffect])

  const label = useMemo(() => {
    if (!hover) return

    const labels = dimensions[hover.index].split(",")
    return labels[labels.length - 1]
  }, [dimensions[hover?.index]])

  return (
    <Fragment>
      <canvas data-testid="groupBox" ref={canvasRef} />
      {hover && (
        <Popover
          target={hover.target}
          label={label}
          groupIndex={groupIndex}
          index={hover.index}
          groupLabel={groupLabel}
          data={pointData}
          id={dimensions[hover.index]}
        />
      )}
    </Fragment>
  )
}

export default GroupBox
