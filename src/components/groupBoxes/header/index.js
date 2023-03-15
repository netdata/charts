import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Status from "./status"
import { Title } from "./title"
import Toolbox from "./toolbox"

const Container = props => (
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

export { Container, Status, Title, Toolbox }

export default Header
