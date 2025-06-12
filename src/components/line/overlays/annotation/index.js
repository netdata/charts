import React, { memo, useEffect, useState } from "react"
import Icon, { Button } from "@/components/icon"
import { useAttributeValue, useChart } from "@/components/provider"
import Tooltip from "@/components/tooltip"
import { Flex, TextSmall, TextMicro } from "@netdata/netdata-ui"
import expandIcon from "@netdata/netdata-ui/dist/components/icon/assets/chevron_expand.svg"
import correlationsIcon from "@netdata/netdata-ui/dist/components/icon/assets/correlations.svg"
import pencilIcon from "@netdata/netdata-ui/dist/components/icon/assets/pencil_outline.svg"
import trashIcon from "@netdata/netdata-ui/dist/components/icon/assets/trashcan.svg"
import xIcon from "@netdata/netdata-ui/dist/components/icon/assets/x.svg"
import checkIcon from "@netdata/netdata-ui/dist/components/icon/assets/check.svg"
import styled from "styled-components"
import { useHovered } from "@/components/useHover"
import { Divider } from "../highlight"
import { annotationPriorities } from "./colorPicker"
import AnnotationForm from "./form"

const hoverTolerance = 5
const debounceDelay = 1000
const timeWindow = 300

const StyledAnnotation = styled(Flex).attrs({
  justifyContent: "center",
  alignItems: "center",
  gap: 2,
  height: "50px",
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
  const chart = useChart()
  const { text, timestamp, author, color, priority } = annotation

  const priorityInfo = annotationPriorities.find(p => p.color === color || p.name === priority)

  return (
    <Flex alignItems="center" gap={1}>
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: color || "#0075F2",
          flexShrink: 0,
        }}
      />
      <Flex column gap={[0.5]}>
        <TextSmall strong color="textLite" ellipsis>
          {text}
        </TextSmall>
        <TextMicro color="textLite">
          {chart.formatDate(timestamp)} • {chart.formatTime(timestamp)}{" "}
          {priorityInfo && `• ${priorityInfo.label}`} {author && `• ${author}`}
        </TextMicro>
      </Flex>
    </Flex>
  )
})

const AnnotationEditForm = memo(({ annotation, onSave, onCancel }) => {
  const handleSave = formData => {
    onSave({
      ...annotation,
      ...formData,
    })
  }

  return (
    <AnnotationForm
      initialText={annotation.text}
      initialColor={annotation.color || "#0075F2"}
      initialPriority={annotation.priority || "info"}
      onSave={handleSave}
      onCancel={onCancel}
      autoFocus
    />
  )
})

const AnnotationActions = memo(({ id, annotation, onEdit }) => {
  const chart = useChart()
  const hasCorrelation = useAttributeValue("hasCorrelation")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSync = () => {
    chart.sdk.trigger("syncToTime", chart, annotation.timestamp)
  }

  const handleCorrelation = () => {
    const range = [annotation.timestamp - timeWindow / 2, annotation.timestamp + timeWindow / 2]
    chart.sdk.trigger("correlation", chart, range)
  }

  const handleEdit = () => {
    onEdit()
  }

  const handleDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    chart.trigger("annotationDelete", id, annotation)
    chart.sdk.trigger("annotationDelete", chart, id, annotation)
    setShowDeleteConfirm(false)
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  if (showDeleteConfirm) {
    return (
      <Flex gap={1} alignItems="center">
        <TextMicro color="textLite">Are you sure?</TextMicro>
        <Button
          icon={<Icon svg={checkIcon} size="16px" />}
          onClick={confirmDelete}
          data-testid="annotation-delete-confirm"
        />
        <Button
          icon={<Icon svg={xIcon} size="16px" />}
          onClick={cancelDelete}
          data-testid="annotation-delete-cancel"
        />
      </Flex>
    )
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
  const [isEditing, setIsEditing] = useState(false)

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

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = updatedAnnotation => {
    chart.trigger("annotationUpdate", id, updatedAnnotation)
    chart.sdk.trigger("annotationUpdate", chart, id, updatedAnnotation)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const isHovered = mouseHovered || popoverHovered || debouncedHovered

  if (!isHovered) return null

  return (
    <StyledAnnotation ref={ref}>
      {isEditing ? (
        <AnnotationEditForm
          annotation={annotation}
          onSave={handleSave}
          onCancel={handleCancelEdit}
        />
      ) : (
        <>
          <AnnotationContent annotation={annotation} />
          <Divider />
          <AnnotationActions id={id} annotation={annotation} onEdit={handleEdit} />
        </>
      )}
    </StyledAnnotation>
  )
}

export default Annotation
