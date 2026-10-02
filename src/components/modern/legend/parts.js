import React from "react"
import styled from "styled-components"
import { Box, Flex, TextMicro } from "@netdata/netdata-ui"
import { labels as annotationLabels } from "@/helpers/annotations"
import { numeralsFont, tabularNumbers } from "@/components/modern/tokens"

export const Swatch = styled(Box).attrs({ as: "span", "data-testid": "modernLegend-swatch" })`
  display: inline-block;
  flex: 0 0 auto;
  width: 10px;
  height: 3px;
  border-radius: 2px;
  background: ${({ swatchColor }) => swatchColor || "transparent"};
`

export const Numeral = styled(Box).attrs({ as: "span" })`
  font-family: ${numeralsFont};
  ${tabularNumbers}
  white-space: nowrap;
`

export const AnomalyBar = styled(Box).attrs({
  as: "span",
  "data-testid": "modernLegend-anomalyBar",
  position: "absolute",
  background: "anomalyText",
})`
  left: 0;
  bottom: -3px;
  height: 2px;
  border-radius: 1px;
  width: ${({ rate }) => Math.min(100, Math.max(0, rate))}%;
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
