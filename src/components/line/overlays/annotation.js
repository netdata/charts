import React, { memo } from "react"
import Icon, { Button } from "@/components/icon"
import { useAttributeValue, useChart } from "@/components/provider"
import useDebouncedValue from "@netdata/netdata-ui/dist/hooks/useDebouncedValue"
import Tooltip from "@/components/tooltip"
import { Flex, TextNano, getColor } from "@netdata/netdata-ui"
import expandIcon from "@netdata/netdata-ui/dist/components/icon/assets/chevron_expand.svg"
import correlationsIcon from "@netdata/netdata-ui/dist/components/icon/assets/correlations.svg"
import pencilIcon from "@netdata/netdata-ui/dist/components/icon/assets/pencil_outline.svg"
import styled from "styled-components"
import { useHovered } from "@/components/useHover"
import { Divider } from "./highlight"

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
})`
  background-color: ${getColor("mainBackground")}80;
  pointer-events: all;
`

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
    // Open edit annotation modal
    chart.sdk.trigger("editAnnotation", chart, id)
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
    </Flex>
  )
})

const Annotation = ({ id }) => {
  const overlays = useAttributeValue("overlays")
  const hoverX = useAttributeValue("hoverX")

  const [ref, hovered] = useHovered({ stop: true }, [id, overlays])

  const annotation = overlays[id]
  const debouncedHoveredLine = useDebouncedValue(
    hoverX && Math.abs(hoverX[0] - annotation.timestamp * 1000) < 60_000,
    400
  )

  if (!annotation || annotation.type !== "annotation") return null

  const isHovered = hovered || debouncedHoveredLine

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
