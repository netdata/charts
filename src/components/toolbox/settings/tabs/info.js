import React from "react"
import { Flex } from "@netdata/netdata-ui"
import Details from "@/components/details"

const InfoBody = () => (
  <Flex column padding={[2]} width={{ min: "260px" }} height={{ max: "60vh" }}>
    <Details />
  </Flex>
)

export default { id: "info", label: "Info", Component: InfoBody }
