import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Icon from "@/components/icon"
import skeletonChart from "./skeleton.svg"

const Skeleton = () => (
  <Flex flex padding={[0, 0, 0, 10]}>
    <Icon svg={skeletonChart} color="borderSecondary" width="100%" height="90%" />
  </Flex>
)

export default Skeleton
