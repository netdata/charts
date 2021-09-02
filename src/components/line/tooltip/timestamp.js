import React, { useMemo } from "react"
import { format } from "date-fns"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"

const Timestamp = ({ value }) => {
  const text = useMemo(() => format(value, "yyyy/MM/dd • HH:mm:ss"), [value])

  return (
    <TextMicro color="textDescription" data-testid="chartTooltip-timestamp">
      {text}
    </TextMicro>
  )
}

export default Timestamp
