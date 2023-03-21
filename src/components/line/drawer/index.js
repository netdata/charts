import React from "react"
import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import Header from "./header"
import Dimensions from "./dimensions"

export const Container = styled.div.attrs({ "data-testid": "chartDrawer" })`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-template-rows: auto;
  grid-template-areas:
    "header header header header"
    "table table table chart";
  column-gap: 4px;
  row-gap: 8px;
  align-items: center;
  padding: 16px;
`

const Drawer = () => {
  const expandedHeight = useAttributeValue("expandedHeight")

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
