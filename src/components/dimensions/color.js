import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"

export const Color = styled(Flex).attrs({
  width: "2px",
  round: true,
  "data-testid": "chartDimensions-color",
})`
  background-color: ${({ bg }) => bg};
`

const Container = ({ chart, id, ...rest }) => {
  const bg = chart.getDimensionColor(id)

  return <Color bg={bg} {...rest} />
}

export default Container
