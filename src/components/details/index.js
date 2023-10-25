import React from "react"
import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import Context from "./context"
import Source from "./source"
import Description from "./description"
import ChartType from "./chartType"

const Container = styled(Flex).attrs({
  column: true,
  padding: [4, 3],
  gap: 5,
  overflow: { vertical: "auto" },
})`
  inset: 0;
`

const Details = () => {
  const nodeName = useAttributeValue("nodeName")

  return (
    <Container data-testid="chartDetails">
      <Description />
      {nodeName && <Source />}
      <Context />
      <ChartType />
    </Container>
  )
}

export default Details
