import React, { useMemo } from "react"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import Header from "./header"
import Dimensions from "./dimensions"
import DrillDown from "./drillDown"
// import Compare from "./compare"
// import Correlate from "./correlate"
import { actions } from "./constants"

const componentsByAction = {
  [actions.values]: Dimensions,
  [actions.drillDown]: DrillDown,
  // [actions.compare]: Compare,
  // [actions.correlate]: Correlate,
}

const Drawer = () => {
  const expandedHeight = useAttributeValue("expandedHeight")
  const action = useAttributeValue("drawerAction")

  const Component = useMemo(() => {
    return componentsByAction[action] || componentsByAction.values
  }, [action])

  return (
    <Flex
      height={`${expandedHeight}px`}
      flex={false}
      column
      gap={2}
      padding={[3, 2]}
      data-testid="drawer"
      background="mainChartBg"
      border={{ side: "top", color: "borderSecondary" }}
    >
      <Header />
      <Component />
    </Flex>
  )
}

export default Drawer
