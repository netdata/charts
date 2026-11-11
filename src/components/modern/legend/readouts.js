import styled from "styled-components"
import { Flex, TextNano, getColor } from "@netdata/netdata-ui"
import { useAttributeValue, useChart, useFormatDate, useFormatTime } from "@/components/provider"
import { radius, tabularNumbers } from "@/components/modern/tokens"
import { formatCompactRange } from "./compactRange"

const HighlightChip = styled(Flex).attrs({
  "data-testid": "modernFooter-highlight",
  as: "button",
  type: "button",
  alignItems: "center",
  flex: "shrink",
  gap: 1,
  padding: [0.5, 2],
  width: { min: "0px", max: "100%" },
  overflow: "hidden",
  border: true,
  round: radius.pill,
  cursor: "pointer",
})`
  background: transparent;
  white-space: nowrap;

  &:hover {
    border-color: ${getColor("text")};
  }
`

const HighlightLabel = styled(TextNano).attrs({ color: "textLite", whiteSpace: "nowrap" })`
  flex-shrink: 0;
`

const HighlightRange = styled(TextNano).attrs({
  color: "textDescription",
  truncate: true,
  "data-testid": "modernFooter-highlightRange",
})`
  ${tabularNumbers}
  min-width: 0;
`

const TimeText = styled(TextNano).attrs({
  color: "textDescription",
  truncate: true,
  "data-testid": "modernFooter-time",
})`
  ${tabularNumbers}
  min-width: 0;
`

export const Highlight = () => {
  const chart = useChart()
  const { highlight } = useAttributeValue("overlays")
  const range = highlight?.range
  useAttributeValue("timezone")
  useAttributeValue("locale")

  if (!range) return null

  const [after, before] = range
  const text = formatCompactRange(chart, after, before)
  const zoomLabel = `Zoom to the highlighted range: ${text}`

  return (
    <HighlightChip
      onClick={() => chart.moveX(after, before)}
      aria-label={zoomLabel}
      title={zoomLabel}
    >
      <HighlightLabel>Highlight</HighlightLabel>
      <HighlightRange>{text}</HighlightRange>
    </HighlightChip>
  )
}

export const Timestamp = ({ label, timestamp }) => {
  const date = useFormatDate(timestamp || 0)
  const time = useFormatTime(timestamp || 0)

  if (timestamp == null) return null

  const text = `${label} ${date} • ${time}`

  return <TimeText title={text}>{text}</TimeText>
}
