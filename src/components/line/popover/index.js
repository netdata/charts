import React, { useEffect, useLayoutEffect, useState, useRef, Fragment } from "react"
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
  const [align, setAlign] = useState(rightBottomAlign)

  targetRef.current = target
  updatePositionRef.current = useMakeUpdatePosition(target, dropRef, align, stretch)

  useEffect(() => {
    return unregister(
      chart.getUI(uiName).on("mousemove", event => {
        if (
          chart.sdk.getRoot().getAttribute("autofetchOnHovering") ||
          chart.getAttribute("panning") ||
          chart.getAttribute("highlighting")
        )
          return

        const offsetX = event.offsetX || event.layerX
        const offsetY = event.offsetY || event.layerY

        if (!targetRef.current) {
          setOpen(true)
          return
        }

        targetRef.current.style.left = `${offsetX}px`
        targetRef.current.style.top = `${offsetY}px`

        setOpen(true)

        if (!dropRef.current) return

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

  // After the DropContainer first mounts on open, position it (and recompute
  // align based on overflow) before paint so the very first frame shows the
  // popover at the cursor with the correct alignment.
  useLayoutEffect(() => {
    if (!open || !targetRef.current || !dropRef.current) return
    updatePositionRef.current?.()
    const offsetX = parseFloat(targetRef.current.style.left) || 0
    const offsetY = parseFloat(targetRef.current.style.top) || 0
    const { width, height } = dropRef.current.getBoundingClientRect()
    const left = offsetX + width > window.innerWidth
    const top = offsetY + height > window.innerHeight
    const next = getAlign(left, top)
    if (next !== align) setAlign(next)
  }, [open])

  const el = useDropElement()

  return (
    <Fragment>
      <Flex ref={r => setTarget(r)} position="absolute" />
      {open &&
        ReactDOM.createPortal(
          <DropContainer
            data-toolbox={chart.getId()}
            margin={[align.top ? 2 : -2, align.right ? -2 : 2]}
            ref={dropRef}
            width={{ max: "100%" }}
            column
            data-testid="drop"
            sx={{ pointerEvents: "none" }}
            zIndex={101}
          >
            <Dimensions uiName={uiName} data-testid="chartPopover" />
          </DropContainer>,
          el
        )}
    </Fragment>
  )
}

export default Popover
