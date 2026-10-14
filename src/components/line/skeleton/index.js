import React from "react"
import { Flex } from "@netdata/netdata-ui"
import { HorizonSkeleton } from "@/components/skeleton"

const Skeleton = ({ height = "90%", ...rest }) => (
  <Flex flex padding={[0, 0, 0, 10]} {...rest}>
    <HorizonSkeleton width="100%" height={height} />
  </Flex>
)

export default Skeleton
