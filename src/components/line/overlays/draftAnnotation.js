import React, { memo, useState } from "react"
import Icon, { Button } from "@/components/icon"
import { useAttributeValue, useChart } from "@/components/provider"
import Tooltip from "@/components/tooltip"
import { Flex, TextNano, TextInput } from "@netdata/netdata-ui"
import plusIcon from "@netdata/netdata-ui/dist/components/icon/assets/plus.svg"
import xIcon from "@netdata/netdata-ui/dist/components/icon/assets/x.svg"
import styled from "styled-components"
import { Divider } from "./highlight"

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

const DraftAnnotationContent = memo(({ draftAnnotation }) => {
  const formatTime = ts => {
    const date = new Date(ts * 1000)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Flex column gap={[0.5]}>
      <TextNano strong color="textLite">
        New annotation
      </TextNano>
      <TextNano color="textLite">{formatTime(draftAnnotation.timestamp)}</TextNano>
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
    return <AnnotationForm />
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

const AnnotationForm = memo(() => {
  const chart = useChart()
  const draftAnnotation = useAttributeValue("draftAnnotation")
  const [text, setText] = useState("")

  const handleSave = () => {
    if (!text.trim()) return

    chart.updateAttribute("draftAnnotation", {
      ...draftAnnotation,
      status: "saving",
    })

    const newAnnotationId = `annotation_${Date.now()}`
    const newAnnotation = {
      id: newAnnotationId,
      type: "annotation",
      timestamp: draftAnnotation.timestamp,
      text: text.trim(),
      created: new Date().toISOString(),
      color: "#0075F2",
    }

    const overlays = chart.getAttribute("overlays")

    chart.updateAttribute("overlays", {
      ...overlays,
      [newAnnotationId]: newAnnotation,
    })

    chart.updateAttribute("draftAnnotation", null)
    chart.trigger("annotationCreated", newAnnotation)
    chart.sdk.trigger("annotationCreated", chart, newAnnotation)
  }

  const handleCancel = () => chart.updateAttribute("draftAnnotation", null)

  const handleKeyDown = e => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancel()
    }
  }

  return (
    <Flex gap={1} alignItems="center">
      <TextInput
        placeholder="Annotation text..."
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />
      <Button label="Save" onClick={handleSave} disabled={!text.trim()} size="small" />
      <Button label="Cancel" onClick={handleCancel} size="small" variant="secondary" />
    </Flex>
  )
})

const DraftAnnotation = () => {
  const draftAnnotation = useAttributeValue("draftAnnotation")

  if (!draftAnnotation) return null

  return (
    <StyledDraftAnnotation>
      <DraftAnnotationContent draftAnnotation={draftAnnotation} />
      <Divider />
      <DraftAnnotationActions />
    </StyledDraftAnnotation>
  )
}

export default DraftAnnotation
