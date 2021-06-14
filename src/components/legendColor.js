import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"

const Color = styled(Flex).attrs({ width: "2px", round: true })`
  background-color: ${({ bg }) => bg};
`

const LegendColor = ({ chart, id, ...rest }) => {
  const bg = chart.getDimensionColor(id)

  return <Color bg={bg} {...rest} />
}

export default LegendColor
