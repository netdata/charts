import React, { useMemo } from "react"
import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import Header from "./header"
import Dimensions from "./dimensions"
import DrillDown from "./drillDown"
import { actions } from "./constants"

export const Container = styled.div.attrs({ "data-testid": "chartDrawer" })`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-template-rows: 40px auto;
  grid-template-areas:
    "header header header header"
    "table table table chart";
  column-gap: 4px;
  row-gap: 8px;
  align-items: start;
  padding: 16px;
`

const componentsByAction = {
  [actions.values]: Dimensions,
  [actions.drillDown]: Dimensions,
  [actions.compare]: Dimensions,
  [actions.correlate]: Dimensions,
}

const Drawer = () => {
  const expandedHeight = useAttributeValue("expandedHeight")
  const action = useAttributeValue("weightsAction")

  const Component = useMemo(() => componentsByAction[action] || componentsByAction.values, [action])

  return (
    <Flex height={`${expandedHeight}px`} flex={false}>
      <Container>
        <Header />
        <Component />
      </Container>
    </Flex>
  )
}

export default Drawer
