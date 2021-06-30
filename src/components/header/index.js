import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Status from "./status"
import Title from "./title"
import Toolbox from "./toolbox"

const Header = ({ chart, toggleDetails, detailsOpen }) => {
  return (
    <Flex
      justifyContent="between"
      alignItems="center"
      padding={[1.5, 3]}
      border={{ side: "bottom", color: "borderSecondary" }}
      data-testid="chartHeader"
    >
      <Status chart={chart} flex basis="0" />
      <Title chart={chart} justifyContent="center" />
      <Toolbox
        chart={chart}
        flex
        basis="0"
        detailsOpen={detailsOpen}
        toggleDetails={toggleDetails}
      />
    </Flex>
  )
}

export default Header
