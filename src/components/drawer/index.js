import React, { useMemo } from "react"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import Header from "./header"
import Dimensions from "./dimensions"
import DrillDown from "./drillDown"
import Compare from "./compare"
import Correlate from "./correlate"
import { actions } from "./constants"

const componentsByAction = {
  [actions.values]: Dimensions,
  [actions.drillDown]: DrillDown,
  [actions.compare]: Compare,
  [actions.correlate]: Correlate,
}

const Drawer = () => {
  const expandedHeight = useAttributeValue("expandedHeight")
  const action = useAttributeValue("drawer.action")
  const hasManagedOverflow =
    action === actions.values || action === actions.drillDown || action === actions.correlate

  const Component = useMemo(() => {
    return componentsByAction[action] || componentsByAction.compare
  }, [action])

  return (
    <Flex
      height={`${expandedHeight}px`}
      flex={false}
      column
      data-testid="drawer"
      background="mainChartBg"
    >
      <Header padding={[0, 2, 2, 2]} />
      <Flex
        flex
        column
        padding={[0, 2, 3, 2]}
        overflow={{ vertical: hasManagedOverflow ? "hidden" : "scroll" }}
        height={{ min: "0px", base: "100%" }}
        data-testid="drawer-content"
      >
        <Component />
      </Flex>
    </Flex>
  )
}

export default Drawer
