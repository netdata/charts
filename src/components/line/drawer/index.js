import React, { useMemo } from "react"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import Header from "./header"
import Dimensions from "./dimensions"
import DrillDown from "./drillDown"
import { actions } from "./constants"

const componentsByAction = {
  [actions.values]: Dimensions,
  [actions.drillDown]: Dimensions,
  [actions.compare]: Dimensions,
  [actions.correlate]: Dimensions,
}

const Drawer = () => {
  const expandedHeight = useAttributeValue("expandedHeight")
  const action = useAttributeValue("weightsAction")

  const Component = useMemo(() => componentsByAction[action] || componentsByAction.values, [action])

  return (
    <Flex height={`${expandedHeight}px`} column gap={2} padding={[4]}>
      <Header />
      <Component />
    </Flex>
  )
}

export default Drawer
