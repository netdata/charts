import React, { useEffect } from "react"
import Icon, { Button } from "@/components/icon"
import useHover from "@/components/useHover"
import correlationsIcon from "@netdata/netdata-ui/lib/components/icon/assets/correlations.svg"
import { useChart, useAttributeValue } from "@/components/provider"
import Badge from "@/components/line/badge"

const minTimeframe = 15
const maxTimeframe = 180

const validatePeriodSelected = total => {
  if (total < minTimeframe) return "(Select at least 15 sec)"
  if (total > maxTimeframe) return "(Select up to 180 sec)"
  return ""
}

export const Period = ({ id, showWarning }) => {
  const overlays = useAttributeValue("overlays")
  const { range } = overlays[id]

  const [after, before] = range
  const total = before - after
  const errorMessage = showWarning ? validatePeriodSelected(total) : ""
  const status = errorMessage ? "warning" : "success"

  return (
    <Badge type={showWarning ? status : "neutral"}>
      {total}sec {errorMessage}
    </Badge>
  )
}

const Correlation = ({ id, setShowWarning }) => {
  const overlays = useAttributeValue("overlays")
  const { range } = overlays[id]

  const [after, before] = range

  const total = before - after
  const errorMessage = validatePeriodSelected(total)

  const chart = useChart()

  const ref = useHover({
    onBlur: () => setShowWarning(false),
    onHover: () => setShowWarning(true),
  })

  return (
    <div ref={ref}>
      <Button
        icon={<Icon svg={correlationsIcon} />}
        title="Run metrics correlations"
        onClick={() => chart.sdk.trigger("correlation", chart, range)}
        data-testid="highlight-correlations"
        disabled={!!errorMessage}
      />
    </div>
  )
}

export default Correlation
