import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"

const FiltersContainer = props => (
  <Flex
    justifyContent="between"
    border={{ side: "bottom", color: "borderSecondary" }}
    padding={[0.5]}
    margin={[0, 0, 0, 1]}
    {...props}
  />
)

export default FiltersContainer
