import React from "react"
import Icon, { Button } from "@/components/icon"
import correlationsIcon from "@netdata/netdata-ui/lib/components/icon/assets/correlations.svg"
import { useChart, useAttributeValue } from "@/components/provider"
import Badge from "@/components/badge"

const minTimeframe = 15
const maxTimeframe = 180

const validatePeriodSelected = total => {
  if (total < minTimeframe) return "(Select at least 15 sec)"
  if (total > maxTimeframe) return "(Select up to 180 sec)"
  return ""
}

export const Period = ({ id, showInstructions }) => {
  const overlays = useAttributeValue("overlays")
  const { range } = overlays[id]

  const [after, before] = range
  const total = (before - after) / 1000
  const errorMessage = validatePeriodSelected(total)
  const status = errorMessage ? "success" : "warning"

  return (
    <Badge type={showInstructions ? status : "neutral"}>
      {total}sec. {errorMessage}
    </Badge>
  )
}

const Correlation = ({ id, correlationRef }) => {
  const overlays = useAttributeValue("overlays")
  const { range } = overlays[id]

  const [after, before] = range

  const total = (before - after) / 1000
  const periodSelectedError = validatePeriodSelected(total)

  const chart = useChart()

  return (
    <Button
      ref={correlationRef}
      icon={<Icon svg={correlationsIcon} />}
      title={["Metrics Correlations", periodSelectedError].join(" ")}
      onClick={() => chart.sdk.trigger("correlation", chart, range)}
      data-testid="highlight-correlations"
      disabled={!!periodSelectedError}
    />
  )
}

export default Correlation
