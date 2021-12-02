import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import correlationsIcon from "@netdata/netdata-ui/lib/components/icon/assets/correlations.svg"
import Icon, { Button } from "@/components/icon"
import Tooltip from "@/components/tooltip"
import { useChart, useAttributeValue } from "@/components/provider"
import Badge from "@/components/line/badge"

const minTimeframe = 15

const validatePeriodSelected = total => {
  if (total < minTimeframe) return "requires 15 secs minimum selection"
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
  const hasCorrelation = useAttributeValue("hasCorrelation")

  if (!hasCorrelation) return null

  return (
    <Tooltip
      content={errorMessage ? `Metrics correlation: ${errorMessage}` : "Run metrics correlation"}
    >
      <Flex>
        <Button
          icon={<Icon svg={correlationsIcon} size="20px" />}
          onClick={() => chart.sdk.trigger("correlation", chart, range)}
          data-testid="highlight-correlations"
          disabled={!!errorMessage}
        />
      </Flex>
    </Tooltip>
  )
}

export default Correlation
