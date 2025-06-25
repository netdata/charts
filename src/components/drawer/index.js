import React, { useMemo } from "react"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import Header from "./header"
import Dimensions from "./dimensions"
import DrillDown from "./drillDown"
import Compare from "./compare"
// import Correlate from "./correlate"
import { actions } from "./constants"

const componentsByAction = {
  [actions.values]: Dimensions,
  [actions.drillDown]: DrillDown,
  [actions.compare]: Compare,
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
      data-testid="drawer"
      background="mainChartBg"
      border={{ side: "top", color: "borderSecondary" }}
    >
      <Header padding={[3, 2, 2, 2]} />
      <Flex
        flex
        column
        padding={[0, 2, 3, 2]}
        overflow={{ vertical: "scroll" }}
      >
        <Component />
      </Flex>
    </Flex>
  )
}

export default Drawer
