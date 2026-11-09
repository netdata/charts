import React from "react"
import styled from "styled-components"
import { TextSmall, getColor } from "@netdata/netdata-ui"
import { useChart, useAttributeValue } from "@/components/provider"
import Shortener from "@/components/helpers/shortener"
import Tooltip from "@/components/tooltip"

const StyledShortener = styled(Shortener)`
  text-shadow:
    0 18px 28px ${getColor("dropdownShadow")},
    0 0 1px ${getColor("dropdownShadow")};
  pointer-events: none;
`

const ChartName = ({ field, normalize, ...rest }) => {
  let value = useAttributeValue(field)
  const chart = useChart()

  if (normalize) {
    value = normalize(value, chart.getAttributes())
  }

  if (!value) return null

  return (
    <Tooltip content={value}>
      <StyledShortener color="key" text={value} Component={TextSmall} {...rest} />
    </Tooltip>
  )
}

export default ChartName
