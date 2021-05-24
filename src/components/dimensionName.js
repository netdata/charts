import React from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"

const LegendName = ({ chart, index, ...rest }) => {
  const name = chart.getPayload().dimensionNames[index]
  return (
    <TextMicro whiteSpace="nowrap" truncate {...rest}>
      {name}
    </TextMicro>
  )
}

export default LegendName
