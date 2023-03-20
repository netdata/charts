import React from "react"
import styled from "styled-components"
import { getColor } from "@netdata/netdata-ui"
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
  border-top: 1px solid ${getColor("borderSecondary")};
  padding: 16px;
`

const Drawer = () => {
  return (
    <Container>
      <Header />
      <Dimensions />
    </Container>
  )
}

export default Drawer
