import styled from "styled-components"
import { Flex, getReadableColor } from "@netdata/netdata-ui"
import { useAttributeValue, useChart, usePayload } from "@/components/provider"
import { numeralsFont, radius } from "@/components/modern/tokens"
import { formatAnomalyRate, getAnomalyColor, getAnomalySummary } from "@/components/modern/anomaly"

const Pill = styled(Flex).attrs({
  as: "span",
  alignItems: "center",
  flex: false,
  round: radius.pill,
})`
  display: inline-flex;
  padding: 2px 9px;
  font-family: ${numeralsFont};
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
  background: ${({ pillBackground }) => pillBackground};
  color: ${({ pillBackground, ...props }) => getReadableColor(pillBackground)(props)};
`

const AnomalyPill = () => {
  const chart = useChart()
  usePayload()
  useAttributeValue("selectedLegendDimensions")
  useAttributeValue("theme")
  const showAnomalies = useAttributeValue("showAnomalies")
  const clickable = !!useAttributeValue("anomalyPillClick")

  if (!showAnomalies) return null

  const summary = getAnomalySummary(chart)
  const { peak, periods } = summary
  if (!periods) return null

  const rounded = formatAnomalyRate(peak)

  const activate = () => {
    chart.trigger("anomalyPillClick", summary)
    chart.sdk.trigger("anomalyPillClick", chart, summary)
  }

  return (
    <Pill
      pillBackground={getAnomalyColor(chart, peak)}
      title={`${periods} anomalous ${periods === 1 ? "period" : "periods"} in this window, peak anomaly rate ${rounded}%`}
      data-testid="chartAnomalyPill"
      {...(clickable && {
        role: "button",
        tabIndex: 0,
        cursor: "pointer",
        "aria-label": "Show which part is anomalous",
        onClick: activate,
        onKeyDown: event => {
          if (event.key !== "Enter" && event.key !== " ") return
          event.preventDefault()
          activate()
        },
      })}
    >
      {`Anomalous, peak ${rounded}%`}
    </Pill>
  )
}

export default AnomalyPill
