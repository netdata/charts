import React from "react"
import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import Context from "./context"
import Source from "./source"
import Description from "./description"
import Units from "./units"

const Container = styled(Flex).attrs({
  column: true,
  padding: [3, 2],
  gap: 3,
  overflow: { vertical: "auto" },
  width: "100%",
  height: "100%",
})``

const Details = () => {
  const nodeName = useAttributeValue("nodeName")

  return (
    <Container data-testid="chartDetails">
      <Description />
      {nodeName && <Source />}
      <Context />
      <Units />
    </Container>
  )
}

export default Details
