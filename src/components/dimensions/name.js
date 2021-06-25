import React from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"

const Name = ({ chart, id, ...rest }) => {
  const name = chart.getDimensionName(id)

  return (
    <TextMicro whiteSpace="nowrap" truncate data-testid="chartDimensions-name" {...rest}>
      {name}
    </TextMicro>
  )
}

export default Name
