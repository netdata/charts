import React, { useEffect, useLayoutEffect, useState, useRef } from "react"
import ReactDOM from "react-dom"
import DropContainer from "@netdata/netdata-ui/dist/components/drops/drop/container"
import useDropElement from "@netdata/netdata-ui/dist/hooks/useDropElement"
import { unregister } from "@/helpers/makeListeners"
import { useChart, useChartUI } from "@/components/provider"
import Dimensions from "./dimensions"

const leftTopAlign = { right: "left", bottom: "top" }
const leftBottomAlign = { right: "left", top: "bottom" }
const rightTopAlign = { left: "right", bottom: "top" }
const rightBottomAlign = { left: "right", top: "bottom" }

const getAlign = (left, top) => {
  if (left && top) return leftTopAlign
  if (left) return leftBottomAlign
  if (top) return rightTopAlign
  return rightBottomAlign
}

const clamp = (value, max) => Math.min(Math.max(0, max), Math.max(0, value))

export const getPopoverPosition = ({
  height,
  pointerX,
  pointerY,
  viewportHeight,
  viewportWidth,
  width,
}) => {
  const left = pointerX + width > viewportWidth
  const top = pointerY + height > viewportHeight

  return {
    align: getAlign(left, top),
    x: clamp(left ? pointerX - width : pointerX, viewportWidth - width),
    y: clamp(top ? pointerY - height : pointerY, viewportHeight - height),
  }
}

const getPointerPosition = event => ({
  x: Number.isFinite(event.clientX)
    ? event.clientX
    : Number.isFinite(event.pageX)
      ? event.pageX - window.scrollX
      : (event.offsetX ?? event.layerX ?? 0),
  y: Number.isFinite(event.clientY)
    ? event.clientY
    : Number.isFinite(event.pageY)
      ? event.pageY - window.scrollY
      : (event.offsetY ?? event.layerY ?? 0),
})

const getObservedSize = entry => {
  const borderBoxSize = Array.isArray(entry.borderBoxSize)
    ? entry.borderBoxSize[0]
    : entry.borderBoxSize

  if (borderBoxSize)
    return {
      height: borderBoxSize.blockSize,
      width: borderBoxSize.inlineSize,
    }

  return {
    height: entry.contentRect.height,
    width: entry.contentRect.width,
  }
}

const Popover = ({ uiName }) => {
  const chart = useChart()
  const chartUI = useChartUI(uiName)
  const dropRef = useRef()
  const alignRef = useRef(rightBottomAlign)
  const frameRef = useRef(null)
  const pointerRef = useRef(null)
  const positionRef = useRef(null)
  const sizeRef = useRef(null)
  const updatePositionRef = useRef(null)
  const schedulePositionRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [align, setAlign] = useState(rightBottomAlign)

  alignRef.current = align
  updatePositionRef.current = () => {
    const drop = dropRef.current
    const pointer = pointerRef.current
    const size = sizeRef.current

    if (!drop || !pointer || !size) return

    const position = getPopoverPosition({
      height: size.height,
      pointerX: pointer.x,
      pointerY: pointer.y,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      width: size.width,
    })

    if (position.align !== alignRef.current) {
      alignRef.current = position.align
      setAlign(position.align)
    }

    const transform = `translate3d(${position.x}px, ${position.y}px, 0)`
    if (transform === positionRef.current) return

    positionRef.current = transform
    drop.style.left = "0px"
    drop.style.top = "0px"
    drop.style.transform = transform
  }
  schedulePositionRef.current = () => {
    if (frameRef.current !== null) return

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null
      updatePositionRef.current()
    })
  }

  const cancelPosition = () => {
    if (frameRef.current === null) return

    window.cancelAnimationFrame(frameRef.current)
    frameRef.current = null
  }

  useEffect(() => {
    const close = () => {
      cancelPosition()
      pointerRef.current = null
      setOpen(false)
    }
    const off = unregister(
      chartUI.on("mousemove", event => {
        if (
          chart.sdk.getRoot().getAttribute("autofetchOnHovering") ||
          chart.getAttribute("panning") ||
          chart.getAttribute("highlighting")
        )
          return

        pointerRef.current = getPointerPosition(event)
        setOpen(true)
        schedulePositionRef.current()
      }),
      chartUI.on("mouseout", close),
      chart.onAttributeChange("panning", panning => panning && close()),
      chart.onAttributeChange("highlighting", highlighting => highlighting && close())
    )

    return () => {
      close()
      off()
    }
  }, [chart, chartUI])

  useLayoutEffect(() => {
    const drop = dropRef.current
    if (!open || !drop) return

    const rect = drop.getBoundingClientRect()
    sizeRef.current = { height: rect.height, width: rect.width }
    updatePositionRef.current()

    let active = true
    const resizeObserver = new ResizeObserver(entries => {
      if (!active) return

      const entry = entries[0]
      if (!entry) return

      const size = getObservedSize(entry)
      if (size.height === sizeRef.current?.height && size.width === sizeRef.current?.width) return

      sizeRef.current = size
      schedulePositionRef.current()
    })
    const updateForViewport = () => schedulePositionRef.current()

    resizeObserver.observe(drop, { box: "border-box" })
    window.addEventListener("resize", updateForViewport)

    return () => {
      active = false
      cancelPosition()
      resizeObserver.disconnect()
      window.removeEventListener("resize", updateForViewport)
      positionRef.current = null
      sizeRef.current = null
    }
  }, [open])

  const el = useDropElement()

  return (
    open &&
    ReactDOM.createPortal(
      <DropContainer
        data-toolbox={chart.getId()}
        margin={[align.top ? 2 : -2, align.right ? -2 : 2]}
        ref={dropRef}
        column
        data-testid="drop"
        sx={{ pointerEvents: "none" }}
        zIndex={101}
      >
        <Dimensions uiName={uiName} data-testid="chartPopover" />
      </DropContainer>,
      el
    )
  )
}

export default Popover
