import React from "react"
import Icon, { Button } from "@/components/icon"
import Tooltip from "@/components/tooltip"
import correlationsIcon from "@netdata/netdata-ui/lib/components/icon/assets/correlations.svg"
import { useChart, useAttributeValue } from "@/components/provider"
import Badge from "@/components/line/badge"

const minTimeframe = 15
const maxTimeframe = 180

const validatePeriodSelected = total => {
  if (total < minTimeframe) return "requires 15sec minimum selection"
  if (total > maxTimeframe) return "requires 180sec maximum selection"
  return ""
}

export const Period = ({ id }) => {
  const overlays = useAttributeValue("overlays")
  const { range } = overlays[id]

  const [after, before] = range
  const total = before - after

  return <Badge type="neutral">{total}sec</Badge>
}

const Correlation = ({ id }) => {
  const overlays = useAttributeValue("overlays")
  const { range } = overlays[id]

  const [after, before] = range

  const total = before - after
  const errorMessage = validatePeriodSelected(total)

  const chart = useChart()

  return (
    <Tooltip
      content={errorMessage ? `Metrics correlation: ${errorMessage}` : "Run metrics correlation"}
    >
      <div>
        <Button
          icon={<Icon svg={correlationsIcon} />}
          onClick={() => chart.sdk.trigger("correlation", chart, range)}
          data-testid="highlight-correlations"
          disabled={!!errorMessage}
        />
      </div>
    </Tooltip>
  )
}

export default Correlation
