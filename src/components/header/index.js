import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Status from "@/components/status"
import Toolbox from "@/components/toolbox"
import { Title } from "@/components/title"

export const Container = props => (
  <Flex
    alignItems="center"
    justifyContent="start"
    padding={[1, 2]}
    gap={1}
    border={{ side: "bottom", color: "borderSecondary" }}
    data-testid="chartHeader"
    height="25px"
    {...props}
  />
)

const Header = () => (
  <Container>
    <Status />
    <Title />
    <Toolbox />
  </Container>
)

export default Header
