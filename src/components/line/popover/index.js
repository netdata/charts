import React, { useEffect, useState, useRef, Fragment } from "react"
import { Flex } from "@netdata/netdata-ui"
import ReactDOM from "react-dom"
import DropContainer from "@netdata/netdata-ui/dist/components/drops/drop/container"
import useMakeUpdatePosition from "@netdata/netdata-ui/dist/components/drops/drop/useMakeUpdatePosition"
import useDropElement from "@netdata/netdata-ui/dist/hooks/useDropElement"
import { unregister } from "@/helpers/makeListeners"
import { useChart } from "@/components/provider"
import Dimensions from "./dimensions"

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

const Popover = ({ uiName }) => {
  const chart = useChart()
  const dropRef = useRef()
  const [target, setTarget] = useState()
  const targetRef = useRef()

  const updatePositionRef = useRef()
  const [open, setOpen] = useState(false)
  const [align, setAlign] = useState(leftTopAlign)

  targetRef.current = target
  updatePositionRef.current = useMakeUpdatePosition(target, dropRef, align, stretch)

  const [dimKey, setDimKey] = useState(0)

  chart.onAttributeChange("selectedLegendDimensions", () => setDimKey(prev => prev + 1))

  useEffect(() => {
    return unregister(
      chart.getUI(uiName).on("mousemove", event => {
        if (chart.getAttribute("panning") || chart.getAttribute("highlighting")) return

        const offsetX = event.offsetX || event.layerX
        const offsetY = event.offsetY || event.layerY

        setOpen(true)

        if (!targetRef.current) return

        targetRef.current.style.left = `${offsetX}px`
        targetRef.current.style.top = `${offsetY}px`

        updatePositionRef.current()

        const { width, height } = dropRef.current.getBoundingClientRect()
        const left = offsetX + width > window.innerWidth
        const top = offsetY + height > window.innerHeight

        setAlign(getAlign(left, top))
      }),
      chart.getUI(uiName).on("mouseout", () => setOpen(false)),
      chart.onAttributeChange("panning", panning => panning && setOpen(false)),
      chart.onAttributeChange("highlighting", panning => panning && setOpen(false))
    )
  }, [chart])

  const el = useDropElement()

  if (!open) return null

  return (
    <Fragment>
      <Flex ref={r => setTarget(r)} position="absolute" />
      {ReactDOM.createPortal(
        <DropContainer
          data-toolbox={chart.getId()}
          margin={[align.top ? 2 : -2, align.right ? -2 : 2]}
          ref={dropRef}
          width={{ max: "100%" }}
          column
          data-testid="drop"
          sx={{ pointerEvents: "none" }}
        >
          <Dimensions key={dimKey} uiName={uiName} data-testid="chartPopover" />
        </DropContainer>,
        el
      )}
    </Fragment>
  )
}

export default Popover
