import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Aggregate from "./aggregate"
import Dimensions from "./dimensions"

const Separator = ({ disabled }) => (
  <Flex width="1px" background={disabled ? "disabled" : "borderSecondary"} />
)

const FilterToolbox = () => {
  return (
    <Flex>
      <Aggregate />
      <Separator />
      <Dimensions />
    </Flex>
  )
}

export default FilterToolbox
