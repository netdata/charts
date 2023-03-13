import React, { useEffect, useState, useRef, forwardRef } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import ReactDOM from "react-dom"
import DropContainer from "@netdata/netdata-ui/lib/components/drops/drop/container"
import useMakeUpdatePosition from "@netdata/netdata-ui/lib/components/drops/drop/useMakeUpdatePosition"
import useDropElement from "@netdata/netdata-ui/lib/hooks/use-drop-element"
import Labels from "./labels"

const LabelsPopover = forwardRef((props, ref) => (
  <Flex data-testid="chartPopover" ref={ref}>
    <Labels {...props} />
  </Flex>
))

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

const Popover = ({ target, label, groupIndex, index, groupLabel, data, id }) => {
  const dropRef = useRef()

  const updatePositionRef = useRef()

  const [align, setAlign] = useState(leftTopAlign)

  updatePositionRef.current = useMakeUpdatePosition(target, dropRef, align, stretch)

  useEffect(() => {
    if (!target?.getBoundingClientRect) return

    const { offsetX, offsetY } = target.getBoundingClientRect()

    updatePositionRef.current()

    const winHeight = window.innerHeight
    const winWidth = window.innerWidth

    const { width, height } = dropRef.current.getBoundingClientRect()
    const left = offsetX + width > winWidth
    const top = offsetY + height > winHeight

    setAlign(getAlign(left, top))
  }, [target])

  const el = useDropElement()

  return ReactDOM.createPortal(
    <DropContainer
      data-toolbox
      margin={[align.top ? 4 : -4, align.right ? -5 : 5]}
      ref={dropRef}
      width={{ max: "100%" }}
      column
      data-testid="drop"
      sx={{ pointerEvents: "none" }}
    >
      <LabelsPopover
        label={label}
        groupIndex={groupIndex}
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
