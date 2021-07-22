import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Status from "./status"
import Title from "./title"
import Toolbox from "./toolbox"

export const Container = props => (
  <Flex
    justifyContent="between"
    alignItems="center"
    padding={[1, 3]}
    gap={1}
    border={{ side: "bottom", color: "borderSecondary" }}
    data-testid="chartHeader"
    {...props}
  />
)

const Header = ({ toggleDetails, detailsOpen }) => (
  <Container>
    <Status />
    <Title />
    <Toolbox detailsOpen={detailsOpen} toggleDetails={toggleDetails} />
  </Container>
)

export default Header
