import React from "react"
import styled from "styled-components"
import { Box, Flex, TextMicro, getColor } from "@netdata/netdata-ui"
import { labels as annotationLabels } from "@/helpers/annotations"
import { Numeral } from "@/components/modern/numerals"

export const Value = styled(Numeral)`
  color: ${getColor("text")};
  font-weight: 600;
`

export const Unit = styled(Box).attrs({ as: "span" })`
  color: ${getColor("textDescription")};
  font-size: 11px;
  white-space: nowrap;
`

export const AnomalyBar = styled(Box).attrs(({ rate }) => ({
  as: "span",
  "data-testid": "modernLegend-anomalyBar",
  position: "absolute",
  left: 0,
  width: `${Math.min(100, Math.max(0, rate))}%`,
  height: 0.5,
  background: "anomalyText",
}))`
  bottom: -3px;
  border-radius: 1px;
  pointer-events: none;
`

export const Flags = ({ flags, full = false }) => {
  if (!flags) return null

  return (
    <Flex gap={0.5} flex={false} data-testid="modernLegend-flags">
      {Object.keys(flags).map(flag => (
        <Flex
          key={flag}
          border={{ size: "1px", side: "all", color: flags[flag] }}
          round
          flex={false}
          padding={[0, 0.5]}
          title={annotationLabels[flag] || flag}
        >
          <TextMicro color={flags[flag]}>{full ? annotationLabels[flag] || flag : flag}</TextMicro>
        </Flex>
      ))}
    </Flex>
  )
}

export const onToggle = (chart, id) => event =>
  chart.toggleDimensionId(id, { merge: event.shiftKey || event.ctrlKey || event.metaKey })
