import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Icon from "@/components/icon"
import skeletonChart from "./skeleton.svg"

const Skeleton = ({ height = "90%", ...rest }) => (
  <Flex flex padding={[0, 0, 0, 10]} {...rest}>
    <Icon svg={skeletonChart} color="borderSecondary" width="100%" height={height} />
  </Flex>
)

export default Skeleton
