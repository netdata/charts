import React from "react"
import styled from "styled-components"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import { useAttributeValue, useMetadata } from "@/components/provider"
import EllipsisInTheMiddle from "@/components/helpers/ellipsisInTheMiddle"

const StyledEllipsisInTheMiddle = styled(EllipsisInTheMiddle)`
  text-shadow: 0 18px 28px rgba(9, 30, 66, 0.15), 0 0 1px rgba(9, 30, 66, 0.31);
  pointer-events: none;
`

const ChartName = ({ field, normalize, ...rest }) => {
  let value = useAttributeValue(field)
  const metadata = useMetadata()

  if (!value) {
    value = metadata[field]
  }

  if (!value) return null

  if (normalize) {
    value = normalize(value)
  }

  return <StyledEllipsisInTheMiddle color="key" text={value} Component={TextSmall} {...rest} />
}

export default ChartName
