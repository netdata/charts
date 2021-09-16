import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Status from "./status"
import Title from "./title"
import Toolbox from "./toolbox"

const Container = props => (
  <Flex
    justifyContent="between"
    alignItems="center"
    padding={[1, 2]}
    gap={1}
    border={{ side: "bottom", color: "borderSecondary" }}
    data-testid="chartHeader"
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
