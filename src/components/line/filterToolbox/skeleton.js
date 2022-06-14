import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import FiltersContainer from "./filtersContainer"
import Label from "./label"

const Skeleton = () => {
  return (
    <FiltersContainer>
      <Flex gap={1}>
        <Label width="90px" background="borderSecondary" secondaryLabel="" label="" />
        <Label width="120px" background="borderSecondary" />
        <Label width="100px" background="borderSecondary" />
      </Flex>
    </FiltersContainer>
  )
}

export default Skeleton
