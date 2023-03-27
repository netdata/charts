import React from "react"
import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import Header from "./header"
import Dimensions from "./dimensions"

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

const Drawer = () => {
  const expandedHeight = useAttributeValue("expandedHeight")
  const action = useAttributeValue("weightsAction")
  const tab = useAttributeValue("weightsTab")

  return (
    <Flex height={`${expandedHeight}px`} flex={false}>
      <Container>
        <Header />
        <Dimensions />
      </Container>
    </Flex>
  )
}

export default Drawer
