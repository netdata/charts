import React from "react"
import styled from "styled-components"
import { Flex, Button } from "@netdata/netdata-ui"
import GridItem from "../gridItem"

const Container = styled(GridItem).attrs({
  area: "header",
  justifyContent: "between",
})`
  &::-webkit-scrollbar {
    height: 0;
  }
`

const Header = ({ ...rest }) => {
  return (
    <Container {...rest}>
      <Flex gap={6}>
        <Button tiny flavour="hollow" label="Analyze" />
        <Flex gap={1}>
          <Button tiny neutral label="Window" />
          <Button tiny neutral label="Selected area" />
          <Button tiny neutral label="Selected point" />
          <Button tiny label="Highlighted" />
          <Button tiny label="Latest" />
        </Flex>
      </Flex>
    </Container>
  )
}

export default Header
