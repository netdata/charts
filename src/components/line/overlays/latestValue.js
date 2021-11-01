import React from "react"
import { TextBig } from "@netdata/netdata-ui/lib/components/typography"
import { useLatestValue } from "@/components/provider"

const LatestValue = ({ dimensionId, ...rest }) => {
  const value = useLatestValue(dimensionId)

  if (isNaN(value)) return null

  return (
    <TextBig strong {...rest}>
      {value}
    </TextBig>
  )
}

export default LatestValue
