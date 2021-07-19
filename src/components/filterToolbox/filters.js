import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Separator from "@/components/separator"
import Aggregate from "./aggregate"
import Dimensions from "./dimensions"
import GroupBy from "./groupBy"

const FilterToolbox = () => {
  return (
    <Flex gap={1}>
      <Aggregate />
      <Separator />
      <Dimensions />
      <Separator />
      <GroupBy />
    </Flex>
  )
}

export default FilterToolbox
