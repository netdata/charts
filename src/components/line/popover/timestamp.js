import React, { useMemo } from "react"
import styled from "styled-components"
import { TextMicro } from "@netdata/netdata-ui"
import { useChart } from "@/components/provider"

const TimestampText = styled(TextMicro)`
  min-width: 0;
`

const Timestamp = ({ value }) => {
  const chart = useChart()
  const text = useMemo(() => `${chart.formatDate(value)} • ${chart.formatTime(value)}`, [value])

  return (
    <TimestampText truncate color="text" data-testid="chartPopover-timestamp">
      {text}
    </TimestampText>
  )
}

export default Timestamp
