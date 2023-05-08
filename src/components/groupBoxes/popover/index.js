import React, { useEffect, useState, useRef } from "react"
import ReactDOM from "react-dom"
import DropContainer from "@netdata/netdata-ui/lib/components/drops/drop/container"
import useMakeUpdatePosition from "@netdata/netdata-ui/lib/components/drops/drop/useMakeUpdatePosition"
import useDropElement from "@netdata/netdata-ui/lib/hooks/use-drop-element"
import Labels from "./labels"

const leftTopAlign = { right: "left", bottom: "top" }
const leftBottomAlign = { right: "left", top: "bottom" }
const rightTopAlign = { left: "right", bottom: "top" }
const rightBottomAlign = { left: "right", top: "bottom" }
const stretch = "width"

const getAlign = (left, top) => {
  if (left && top) return leftTopAlign
  if (left) return leftBottomAlign
  if (top) return rightTopAlign
  return rightBottomAlign
}

const Popover = ({ target, label, index, groupLabel, data, id }) => {
  const dropRef = useRef()

  const updatePositionRef = useRef()

  const [align, setAlign] = useState(rightBottomAlign)

  updatePositionRef.current = useMakeUpdatePosition(target, dropRef, align, stretch)

  useEffect(() => {
    if (!target?.getBoundingClientRect) return

    const { right: targetRight, bottom: targetBottom } = target.getBoundingClientRect()

    const winHeight = window.innerHeight
    const winWidth = window.innerWidth

    const { width, height } = dropRef.current.getBoundingClientRect()
    const left = targetRight + width > winWidth
    const top = targetBottom + height > winHeight

    setAlign(getAlign(left, top))
  }, [target])

  useEffect(() => {
    updatePositionRef.current()
  }, [align])

  const el = useDropElement()

  return ReactDOM.createPortal(
    <DropContainer
      data-toolbox
      ref={dropRef}
      width={{ max: "100%" }}
      column
      data-testid="drop"
      sx={{ pointerEvents: "none" }}
    >
      <Labels
        data-testid="chartPopover"
        label={label}
        index={index}
        groupLabel={groupLabel}
        data={data}
        id={id}
      />
    </DropContainer>,
    el
  )
}

export default Popover
