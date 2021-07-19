import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Separator from "@/components/separator"
import FiltersContainer from "./filtersContainer"
import Label from "./label"

const Skeleton = () => {
  return (
    <FiltersContainer>
      <Flex gap={1}>
        <Label width="90px" background="borderSecondary" secondaryLabel="" label="" />
        <Separator />
        <Label width="120px" background="borderSecondary" />
        <Separator />
        <Label width="100px" background="borderSecondary" />
      </Flex>
    </FiltersContainer>
  )
}

export default Skeleton
