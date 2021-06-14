import React from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"

const LegendName = ({ chart, id, ...rest }) => {
  const name = chart.getDimensionName(id)

  return (
    <TextMicro whiteSpace="nowrap" truncate {...rest}>
      {name}
    </TextMicro>
  )
}

export default LegendName
