import React, { memo, useEffect, useState, useRef } from "react"
import Icon, { Button } from "@/components/icon"
import { useAttributeValue, useChart } from "@/components/provider"
import Tooltip from "@/components/tooltip"
import { Flex, TextNano } from "@netdata/netdata-ui"
import expandIcon from "@netdata/netdata-ui/dist/components/icon/assets/chevron_expand.svg"
import correlationsIcon from "@netdata/netdata-ui/dist/components/icon/assets/correlations.svg"
import pencilIcon from "@netdata/netdata-ui/dist/components/icon/assets/pencil_outline.svg"
import trashIcon from "@netdata/netdata-ui/dist/components/icon/assets/trashcan.svg"
import styled from "styled-components"
import { useHovered } from "@/components/useHover"
import { Divider } from "./highlight"

const hoverTolerance = 5
const debounceDelay = 1000

const StyledAnnotation = styled(Flex).attrs({
  justifyContent: "center",
  alignItems: "center",
  gap: 2,
  height: "40px",
  alignSelf: "center",
  round: true,
  width: { min: "120px" },
  padding: [1, 2],
  border: { side: "all", color: "borderSecondary" },
  background: "mainBackground",
  backgroundOpacity: 0.8,
  zIndex: 20,
})``

const AnnotationContent = memo(({ annotation }) => {
  const { text, timestamp, author } = annotation

  const formatTime = ts => {
    const date = new Date(ts * 1000)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Flex column gap={[0.5]}>
      <TextNano strong color="textLite" ellipsis>
        {text}
      </TextNano>
      <TextNano color="textLite">
        {formatTime(timestamp)} {author && `• ${author}`}
      </TextNano>
    </Flex>
  )
})

const AnnotationActions = memo(({ id, annotation }) => {
  const chart = useChart()
  const hasCorrelation = useAttributeValue("hasCorrelation")

  const handleSync = () => {
    // Sync all charts to this timestamp
    chart.sdk.trigger("syncToTime", chart, annotation.timestamp)
  }

  const handleCorrelation = () => {
    // Run correlation at this point (using small time window around annotation)
    const timeWindow = 300 // 5 minutes window
    const range = [annotation.timestamp - timeWindow / 2, annotation.timestamp + timeWindow / 2]
    chart.sdk.trigger("correlation", chart, range)
  }

  const handleEdit = () => {
    chart.trigger("annotationEdit", id)
    chart.sdk.trigger("annotationEdit", chart, id)
  }

  const handleDelete = () => {
    chart.trigger("annotationDelete", id)
    chart.sdk.trigger("annotationDelete", chart, id)
  }

  return (
    <Flex gap={1}>
      <Tooltip content="Sync all charts to this time">
        <Button
          icon={<Icon svg={expandIcon} size="16px" />}
          onClick={handleSync}
          data-testid="annotation-sync"
        />
      </Tooltip>

      {hasCorrelation && (
        <Tooltip content="Run metrics correlation at this point">
          <Button
            icon={<Icon svg={correlationsIcon} size="16px" />}
            onClick={handleCorrelation}
            data-testid="annotation-correlation"
          />
        </Tooltip>
      )}

      <Tooltip content="Edit annotation">
        <Button
          icon={<Icon svg={pencilIcon} size="16px" />}
          onClick={handleEdit}
          data-testid="annotation-edit"
        />
      </Tooltip>

      <Tooltip content="Delete annotation">
        <Button
          icon={<Icon svg={trashIcon} size="16px" />}
          onClick={handleDelete}
          data-testid="annotation-delete"
        />
      </Tooltip>
    </Flex>
  )
})

const Annotation = ({ id }) => {
  const chart = useChart()
  const overlays = useAttributeValue("overlays")
  const [ref, popoverHovered] = useHovered({ stop: true }, [id, overlays])
  const [mouseHovered, setMouseHovered] = useState(false)
  const [debouncedHovered, setDebouncedHovered] = useState(false)
  const containerRef = useRef()

  const annotation = overlays[id]

  useEffect(() => {
    if (!annotation || !chart || chart.getAttribute("chartLibrary") !== "dygraph") return

    const chartUI = chart.getUI()
    if (!chartUI) return

    const dygraph = chartUI.getDygraph()
    if (!dygraph) return

    const handleMouseMove = event => {
      const canvas = dygraph.canvas_
      const rect = canvas.getBoundingClientRect()
      const offsetX = event.clientX - rect.left
      
      const currentTimestamp = dygraph.toDataXCoord(offsetX) / 1000
      const annotationX = dygraph.toDomXCoord(annotation.timestamp * 1000)
      
      const isNearAnnotation = Math.abs(offsetX - annotationX) < hoverTolerance
      setMouseHovered(isNearAnnotation)
    }

    const canvas = dygraph.canvas_
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseleave", () => setMouseHovered(false))

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseleave", () => setMouseHovered(false))
    }
  }, [annotation, chart])

  useEffect(() => {
    const hovered = mouseHovered || popoverHovered
    if (hovered) {
      setDebouncedHovered(true)
    } else {
      const timeout = setTimeout(() => setDebouncedHovered(false), debounceDelay)
      return () => clearTimeout(timeout)
    }
  }, [mouseHovered, popoverHovered])

  if (!annotation || annotation.type !== "annotation") return null

  const isHovered = mouseHovered || popoverHovered || debouncedHovered

  if (!isHovered) return null

  return (
    <StyledAnnotation ref={ref}>
      <AnnotationContent annotation={annotation} />
      <Divider />
      {/* <AnnotationActions id={id} annotation={annotation} /> */}
      {/* TODO enable actions later when we are ready */}
    </StyledAnnotation>
  )
}

export default Annotation
