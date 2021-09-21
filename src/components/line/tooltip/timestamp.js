import React, { useMemo } from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import { useChart } from "@/components/provider"

const Timestamp = ({ value }) => {
  const chart = useChart()
  const text = useMemo(() => `${chart.formatDate(value)} • ${chart.formatTime(value)}`, [value])

  return (
    <TextMicro color="textDescription" data-testid="chartTooltip-timestamp">
      {text}
    </TextMicro>
  )
}

export default Timestamp
