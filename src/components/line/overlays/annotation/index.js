import React, { memo, useEffect, useState } from "react"
import Icon, { Button } from "@/components/icon"
import { useAttributeValue, useChart } from "@/components/provider"
import Tooltip from "@/components/tooltip"
import { Flex, TextSmall, TextMicro } from "@netdata/netdata-ui"
import expandIcon from "@netdata/netdata-ui/dist/components/icon/assets/chevron_expand.svg"
import universeIcon from "@netdata/netdata-ui/dist/components/icon/assets/universe.svg"
import correlationsIcon from "@netdata/netdata-ui/dist/components/icon/assets/correlations.svg"
import pencilIcon from "@netdata/netdata-ui/dist/components/icon/assets/pencil_outline.svg"
import trashIcon from "@netdata/netdata-ui/dist/components/icon/assets/trashcan.svg"
import xIcon from "@netdata/netdata-ui/dist/components/icon/assets/x.svg"
import checkIcon from "@netdata/netdata-ui/dist/components/icon/assets/check.svg"
import copyIcon from "@netdata/netdata-ui/dist/components/icon/assets/copy.svg"
import styled from "styled-components"
import { useHovered } from "@/components/useHover"
import { Divider } from "../highlight"
import { annotationPriorities } from "./colorPicker"
import makeLog from "@/sdk/makeLog"
import AnnotationForm from "./form"

const hoverTolerance = 5
const debounceDelay = 1000
const timeWindow = 300

const hasActiveSyncs = (chart, id) => {
  const allCharts = chart.getApplicableNodes({})
  return allCharts.some(targetChart => {
    if (targetChart.getId() === chart.getId()) return false
    const overlays = targetChart.getAttribute("overlays")
    return Object.keys(overlays).some(overlayId => 
      overlayId.startsWith(`synced_${id}_from_${chart.getId()}`)
    )
  })
}

const UniverseButton = styled(Button)`
  svg {
    fill: ${({ theme, $state }) => {
      if ($state === "global") return theme.colors.primary
      if ($state === "temp") return theme.colors.warning
      return theme.colors.textDescription
    }};
  }
`

const StyledAnnotation = styled(Flex).attrs(({ isSynced }) => ({
  justifyContent: "center",
  alignItems: "center",
  gap: 2,
  height: "50px",
  alignSelf: "center",
  round: true,
  width: { min: "120px" },
  padding: [1, 2],
  border: { side: "all", color: isSynced ? "borderPrimary" : "borderSecondary" },
  background: "mainBackground",
  backgroundOpacity: isSynced ? 0.6 : 0.8,
  zIndex: 20,
}))`
  ${({ isSynced }) =>
    isSynced &&
    `
    opacity: 0.75;
    border-style: dashed;
  `}
`

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
      <Flex column gap={[0.5]} title={text}>
        <TextSmall strong color="textLite" ellipsis>
          {text}
        </TextSmall>
        <TextMicro color="textLite">
          {chart.formatDate(timestamp * 1000)} • {chart.formatTime(timestamp * 1000)}{" "}
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
  const [clickTimeout, setClickTimeout] = useState(null)
  const isSynced = !!annotation.originallyFrom
  const isGlobal = !!annotation.isGlobal
  const isTemp = isSynced && !isGlobal
  const isRoot = !isSynced && !isGlobal
  const isRootWithSyncs = isRoot && hasActiveSyncs(chart, id)

  const handleClearTemp = () => {
    if (isTemp && annotation.originallyFrom) {
      const allCharts = chart.getApplicableNodes({})
      const sourceChart = allCharts.find(c => c.getId() === annotation.originallyFrom)
      if (sourceChart) {
        chart.sdk.trigger("clearSyncedAnnotations", sourceChart)
      }
    } else {
      chart.sdk.trigger("clearSyncedAnnotations", chart)
    }
  }

  const handleMakeGlobal = () => {
    const globalAnnotation = {
      ...annotation,
      isGlobal: true,
      entity: "global",
    }

    makeLog(chart)({
      event: "annotation_made_global",
      annotationId: id,
    })

    chart.trigger("annotationUpdate", id, globalAnnotation)
    chart.sdk.trigger("annotationUpdate", chart, id, globalAnnotation)
  }

  const handleMakeChartSpecific = () => {
    const contextScope = chart.getAttribute("contextScope")
    const chartEntity = chart.getAttribute("isHead")
      ? chart.getAttribute("id")
      : contextScope.join(",")

    const chartSpecificAnnotation = {
      ...annotation,
      isGlobal: false,
      entity: chartEntity,
    }

    makeLog(chart)({
      event: "annotation_made_chart_specific",
      annotationId: id,
    })

    chart.trigger("annotationUpdate", id, chartSpecificAnnotation)
    chart.sdk.trigger("annotationUpdate", chart, id, chartSpecificAnnotation)
    chart.sdk.trigger("clearAnnotationFromOtherCharts", chart, id)
  }

  const handleSyncClick = () => {
    if (clickTimeout) {
      clearTimeout(clickTimeout)
      setClickTimeout(null)
      if (isGlobal) {
        handleMakeChartSpecific()
      } else {
        handleMakeGlobal()
      }
    } else {
      const timeout = setTimeout(() => {
        setClickTimeout(null)
        if (isGlobal) {
          // Global: single click does nothing (stay global)
        } else if (isTemp || isRootWithSyncs) {
          handleClearTemp()
        } else {
          chart.sdk.trigger("syncAnnotation", chart, id, annotation)
        }
      }, 300)
      setClickTimeout(timeout)
    }
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

  const handleGoToChart = () => {
    chart.sdk.trigger("goToLink", chart, annotation.originallyFrom)
  }

  const handleRemoveSync = () => {
    const overlays = chart.getAttribute("overlays")
    // eslint-disable-next-line no-unused-vars
    const { [id]: removed, ...remainingOverlays } = overlays
    chart.updateAttribute("overlays", remainingOverlays)
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      makeLog(chart)({
        event: "annotation_url_copied",
        annotationId: id,
      })
    } catch (err) {
      makeLog(chart)({
        event: "annotation_url_copy_failed",
        annotationId: id,
      })
    }
  }

  const confirmDelete = () => {
    // Log annotation deletion for debugging
    makeLog(chart)({
      event: isSynced ? "annotation_sync_removed" : "annotation_deleted",
      annotationId: id,
    })

    if (isSynced) {
      handleRemoveSync()
    } else {
      chart.trigger("annotationDelete", id, annotation)
      chart.sdk.trigger("annotationDelete", chart, id, annotation)
    }
    setShowDeleteConfirm(false)
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  if (showDeleteConfirm) {
    return (
      <Flex gap={1} alignItems="center">
        <TextMicro color="textLite">
          {isSynced ? "Remove from this chart?" : "Are you sure?"}
        </TextMicro>
        <Button
          icon={<Icon svg={checkIcon} size="16px" />}
          onClick={confirmDelete}
          data-testid="annotation-delete-confirm"
          data-track={chart.track(`annotation-delete-confirm-${isSynced ? "synced" : "local"}`)}
        />
        <Button
          icon={<Icon svg={xIcon} size="16px" />}
          onClick={cancelDelete}
          data-testid="annotation-delete-cancel"
          data-track={chart.track("annotation-delete-cancel")}
        />
      </Flex>
    )
  }

  if (isSynced) {
    return (
      <Flex gap={1}>
        <Tooltip content="Go to source chart">
          <Button
            icon={<Icon svg={expandIcon} size="16px" />}
            onClick={handleGoToChart}
            data-testid="annotation-goto-chart"
            data-track={chart.track("annotation-goto-source-chart")}
          />
        </Tooltip>

        {hasCorrelation && (
          <Tooltip content="Run metrics correlation at this point">
            <Button
              icon={<Icon svg={correlationsIcon} size="16px" />}
              onClick={handleCorrelation}
              data-testid="annotation-correlation"
              data-track={chart.track("annotation-correlation")}
            />
          </Tooltip>
        )}

        <Tooltip content="Copy URL to annotation">
          <Button
            icon={<Icon svg={copyIcon} size="16px" />}
            onClick={handleCopyUrl}
            data-testid="annotation-copy-url"
            data-track={chart.track("annotation-copy-url")}
          />
        </Tooltip>

        <Tooltip content="Remove annotation sync">
          <Button
            icon={<Icon svg={trashIcon} size="16px" />}
            onClick={handleDelete}
            data-testid="annotation-remove-sync"
            data-track={chart.track("annotation-remove-sync")}
          />
        </Tooltip>
      </Flex>
    )
  }

  const getTooltipContent = () => {
    if (isGlobal) return "Global annotation • Double-click to make chart-specific"
    if (isTemp) return "Temporarily synced • Click: remove sync • Double-click: make global"
    if (isRootWithSyncs) return "Temporarily synced • Click: remove sync • Double-click: make global"
    return "Click: sync temporarily • Double-click: make global"
  }

  const getButtonState = () => {
    if (isGlobal) return "global"
    if (isTemp) return "temp"
    if (isRootWithSyncs) return "temp"
    return "context"
  }

  return (
    <Flex gap={1}>
      <Tooltip content={getTooltipContent()}>
        <UniverseButton
          $state={getButtonState()}
          icon={<Icon svg={universeIcon} size="16px" />}
          onClick={handleSyncClick}
          data-testid={`annotation-${getButtonState()}`}
          data-track={chart.track(`annotation-${getButtonState()}-action`)}
        />
      </Tooltip>

      {hasCorrelation && (
        <Tooltip content="Run metrics correlation at this point">
          <Button
            icon={<Icon svg={correlationsIcon} size="16px" />}
            onClick={handleCorrelation}
            data-testid="annotation-correlation"
            data-track={chart.track("annotation-correlation")}
          />
        </Tooltip>
      )}

      <Tooltip content="Copy URL to annotation">
        <Button
          icon={<Icon svg={copyIcon} size="16px" />}
          onClick={handleCopyUrl}
          data-testid="annotation-copy-url"
          data-track={chart.track("annotation-copy-url")}
        />
      </Tooltip>

      <Tooltip content="Edit annotation">
        <Button
          icon={<Icon svg={pencilIcon} size="16px" />}
          onClick={handleEdit}
          data-testid="annotation-edit"
          data-track={chart.track("annotation-edit")}
        />
      </Tooltip>

      <Tooltip content="Delete annotation">
        <Button
          icon={<Icon svg={trashIcon} size="16px" />}
          onClick={handleDelete}
          data-testid="annotation-delete"
          data-track={chart.track("annotation-delete")}
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
  const isSynced = !!annotation?.originallyFrom

  useEffect(() => {
    if (
      !annotation ||
      !annotation.timestamp ||
      !chart ||
      chart.getAttribute("chartLibrary") !== "dygraph"
    )
      return

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
  }, [annotation, annotation?.timestamp, chart, id])

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

  const handleEdit = () => setIsEditing(true)

  const handleSave = updatedAnnotation => {
    // Log annotation edit for debugging
    makeLog(chart)({
      event: "annotation_updated",
      annotationId: id,
    })

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
    <StyledAnnotation
      ref={ref}
      isSynced={isSynced}
      data-track={chart.track(`annotation-hover-${isSynced ? "synced" : "local"}`)}
    >
      {isEditing && !isSynced ? (
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
