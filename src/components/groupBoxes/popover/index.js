import React, { useEffect, useState, useRef } from "react"
import ReactDOM from "react-dom"
import { useAttributeValue } from "@/components/provider"
import DropContainer from "@netdata/netdata-ui/dist/components/drops/drop/container"
import useMakeUpdatePosition from "@netdata/netdata-ui/dist/components/drops/drop/useMakeUpdatePosition"
import useDropElement from "@netdata/netdata-ui/dist/hooks/useDropElement"
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

const Popover = ({ target, label, groupLabel, data, id }) => {
  const dropRef = useRef()

  const updatePositionRef = useRef()

  const [align, setAlign] = useState(rightBottomAlign)

  updatePositionRef.current = useMakeUpdatePosition(target, dropRef, align, stretch)

  useEffect(() => {
    if (!target?.getBoundingClientRect || !dropRef.current) return

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
  const chartId = useAttributeValue("id")

  return ReactDOM.createPortal(
    <DropContainer
      data-toolbox={chartId}
      ref={dropRef}
      width={{ max: "100%" }}
      column
      data-testid="drop"
      sx={{ pointerEvents: "none" }}
    >
      <Labels
        data-testid="chartPopover"
        label={label}
        groupLabel={groupLabel}
        data={data}
        id={id}
      />
    </DropContainer>,
    el
  )
}

export default Popover
