import React from "react"
import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue, useChart, usePayload } from "@/components/provider"
import { numeralsFont, radius } from "@/components/modern/tokens"
import { formatAnomalyRate, getAnomalyColor, getAnomalySummary } from "@/components/modern/anomaly"

const Pill = styled(Flex).attrs({ as: "span", alignItems: "center", flex: false })`
  display: inline-flex;
  padding: 2px 9px;
  border-radius: ${radius.pill};
  font-family: ${numeralsFont};
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
  color: ${({ ink }) => ink};
  background: ${({ pillBackground }) => pillBackground};
`

const inks = ["#FFFFFF", "#0F0B1D"]

const AnomalyPill = () => {
  const chart = useChart()
  usePayload()
  useAttributeValue("selectedLegendDimensions")
  useAttributeValue("theme")
  const showAnomalies = useAttributeValue("showAnomalies")

  if (!showAnomalies) return null

  const { peak, periods } = getAnomalySummary(chart)
  if (!periods) return null

  const themeIndex = chart.getThemeIndex()
  const rounded = formatAnomalyRate(peak)

  return (
    <Pill
      pillBackground={getAnomalyColor(chart, peak)}
      ink={inks[themeIndex] || inks[0]}
      title={`${periods} anomalous ${periods === 1 ? "period" : "periods"} in this window, peak anomaly rate ${rounded}%`}
      data-testid="chartAnomalyPill"
    >
      {`Anomalous, peak ${rounded}%`}
    </Pill>
  )
}

export default AnomalyPill
