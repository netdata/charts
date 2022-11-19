import React, { useRef, useLayoutEffect, Fragment, useState, useCallback } from "react"
import Drop from "@netdata/netdata-ui/lib/components/drops/drop"
import drawBoxes from "./drawBoxes"
import getAlign from "./getAlign"

const aligns = {
  top: { bottom: "top" },
  bottom: { top: "bottom" },
}

const GroupBox = ({ data, renderTooltip, getColor, ...options }) => {
  const dataRef = useRef()
  const canvasRef = useRef()
  const boxesRef = useRef()

  const [hover, setHover] = useState(null)
  const dropHoverRef = useRef(false)
  const boxHoverRef = useRef(-1)
  const timeoutId = useRef()

  const closeDrop = () =>
    requestAnimationFrame(() => {
      setHover(currentHover => {
        if (
          !dropHoverRef.current &&
          (boxHoverRef.current === -1 || boxHoverRef.current !== currentHover?.index)
        ) {
          boxesRef.current.deactivateBox()
          boxHoverRef.current = -1
          return null
        }
        return currentHover
      })
    })

  useLayoutEffect(() => {
    boxesRef.current = drawBoxes(
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
          dropHoverRef.current = false
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

  useLayoutEffect(() => {
    if (
      hover &&
      dataRef.current &&
      dataRef.current.labels[hover.index] !== data.labels[hover.index]
    ) {
      boxesRef.current.deactivateBox()
      setHover(null)
      boxHoverRef.current = -1
    }
    dataRef.current = data
    boxesRef.current.update(data, getColor)
  }, [data, getColor])

  const onMouseEnter = useCallback(() => {
    dropHoverRef.current = true
  }, [])

  const onMouseLeave = useCallback(() => {
    dropHoverRef.current = false
    closeDrop()
  }, [])

  const align = hover && getAlign(hover.target)

  return (
    <Fragment>
      <canvas data-testid="groupBox" ref={canvasRef} />
      {hover && renderTooltip && (
        <Drop
          align={aligns[align]}
          target={hover.target}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {renderTooltip(hover.index, align)}
        </Drop>
      )}
    </Fragment>
  )
}

export default GroupBox
