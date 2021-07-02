import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useChart } from "@/components/provider"

export const Color = styled(Flex).attrs({
  width: "2px",
  round: true,
  "data-testid": "chartDimensions-color",
})`
  background-color: ${({ bg }) => bg};
`

const Container = ({ id, ...rest }) => {
  const chart = useChart()
  const bg = chart.getDimensionColor(id)

  return <Color bg={bg} {...rest} />
}

export default Container
