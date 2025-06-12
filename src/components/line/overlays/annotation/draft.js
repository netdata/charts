import React, { memo } from "react"
import Icon, { Button } from "@/components/icon"
import { useAttributeValue, useChart } from "@/components/provider"
import Tooltip from "@/components/tooltip"
import { Flex, TextNano } from "@netdata/netdata-ui"
import plusIcon from "@netdata/netdata-ui/dist/components/icon/assets/plus.svg"
import xIcon from "@netdata/netdata-ui/dist/components/icon/assets/x.svg"
import styled from "styled-components"
import { Divider } from "../highlight"
import AnnotationForm from "./form"

const StyledDraftAnnotation = styled(Flex).attrs({
  justifyContent: "center",
  alignItems: "center",
  gap: 2,
  height: "40px",
  alignSelf: "center",
  round: true,
  width: { min: "120px" },
  padding: [1, 2],
  border: { side: "all", color: "borderSecondary", style: "dashed" },
  background: "mainBackground",
  backgroundOpacity: 0.8,
  zIndex: 10,
})``

const DraftAnnotationContent = memo(({ annotation }) => {
  const chart = useChart()

  return (
    <Flex column gap={[0.5]}>
      <TextNano strong color="textLite">
        New annotation
      </TextNano>
      <TextNano color="textLite">
        {chart.formatTime(annotation.timestamp)} • {chart.formatTime(annotation.timestamp)}
      </TextNano>
    </Flex>
  )
})

const DraftAnnotationActions = memo(() => {
  const chart = useChart()
  const draftAnnotation = useAttributeValue("draftAnnotation")

  const handleStartEditing = () => {
    chart.updateAttribute("draftAnnotation", {
      ...draftAnnotation,
      status: "editing",
    })
  }

  const handleCancel = () => {
    chart.updateAttribute("draftAnnotation", null)
  }

  if (draftAnnotation.status === "editing") {
    return <DraftAnnotationForm />
  }

  return (
    <Flex gap={1}>
      <Tooltip content="Add annotation text">
        <Button
          icon={<Icon svg={plusIcon} size="16px" />}
          onClick={handleStartEditing}
          data-testid="draft-annotation-add"
        />
      </Tooltip>

      <Tooltip content="Cancel annotation">
        <Button
          icon={<Icon svg={xIcon} size="16px" />}
          onClick={handleCancel}
          data-testid="draft-annotation-cancel"
        />
      </Tooltip>
    </Flex>
  )
})

const DraftAnnotationForm = memo(() => {
  const chart = useChart()
  const draftAnnotation = useAttributeValue("draftAnnotation")

  const handleSave = formData => {
    chart.updateAttribute("draftAnnotation", {
      ...draftAnnotation,
      status: "saving",
    })

    const newAnnotation = {
      id: `annotation_${draftAnnotation.timestamp}_${formData.text
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 8)}`,
      type: "annotation",
      timestamp: draftAnnotation.timestamp,
      text: formData.text,
      created: new Date().toISOString(),
      color: formData.color,
      priority: formData.priority,
    }

    const overlays = chart.getAttribute("overlays")

    chart.updateAttribute("overlays", {
      ...overlays,
      [newAnnotation.id]: newAnnotation,
    })

    chart.updateAttribute("draftAnnotation", null)
    chart.trigger("annotationCreated", newAnnotation)
    chart.sdk.trigger("annotationCreated", chart, newAnnotation)
  }

  const handleCancel = () => chart.updateAttribute("draftAnnotation", null)

  return (
    <AnnotationForm
      placeholder="Annotation text..."
      onSave={handleSave}
      onCancel={handleCancel}
      autoFocus
    />
  )
})

const DraftAnnotation = () => {
  const draftAnnotation = useAttributeValue("draftAnnotation")

  if (!draftAnnotation) return null

  return (
    <StyledDraftAnnotation>
      <DraftAnnotationContent annotation={draftAnnotation} />
      <Divider />
      <DraftAnnotationActions />
    </StyledDraftAnnotation>
  )
}

export default DraftAnnotation
