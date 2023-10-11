import React, { useMemo } from "react"
import { TextMicro } from "@netdata/netdata-ui"
import { useChart } from "@/components/provider"

const Timestamp = ({ value }) => {
  const chart = useChart()
  const text = useMemo(() => `${chart.formatDate(value)} • ${chart.formatTime(value)}`, [value])

  return (
    <TextMicro color="textDescription" data-testid="chartPopover-timestamp">
      {text}
    </TextMicro>
  )
}

export default Timestamp
