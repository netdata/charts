import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useChart } from "@/components/provider"
import Status from "./status"
import Title from "./title"
import Toolbox from "./toolbox"

const Header = ({ toggleDetails, detailsOpen }) => (
  <Flex
    justifyContent="between"
    alignItems="center"
    padding={[1, 3]}
    gap={1}
    border={{ side: "bottom", color: "borderSecondary" }}
    data-testid="chartHeader"
  >
    <Status flex basis="0" />
    <Title flex="shrink" justifyContent="center" />
    <Toolbox flex basis="0" detailsOpen={detailsOpen} toggleDetails={toggleDetails} />
  </Flex>
)

export default Header
