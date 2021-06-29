import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"

export const Container = styled(Flex).attrs({ width: "2px", round: true })`
  background-color: ${({ bg }) => bg};
`

const Color = ({ chart, id, ...rest }) => {
  const bg = chart.getDimensionColor(id)

  return <Container bg={bg} data-testid="chartDimensions-color" {...rest} />
}

export default Color
