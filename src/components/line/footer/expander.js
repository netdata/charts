import React from "react"
import styled from "styled-components"
import { Flex, TextSmall, getColor } from "@netdata/netdata-ui"
import chevronExpand from "@netdata/netdata-ui/dist/components/icon/assets/chevron_expand.svg"
import Tooltip from "@/components/tooltip"
import { useChart, useAttributeValue } from "@/components/provider"
import Icon from "@/components/icon"

const Container = styled(Flex).attrs(props => ({
  "data-testid": "chartExpander",
  alignItems: "center",
  justifyContent: "center",
  gap: 1,
  ...props,
}))`
  &:hover > * {
    color: ${getColor("text")};
    fill: ${getColor("text")};
  }
`

const actionDescriptions = {
  values: "View detailed statistics, dimension values, and time ranges",
  drillDown: "Explore related metrics and child contexts",
  compare: "Compare data across different time periods",
  correlate: "Find correlated metrics and patterns",
}

const Expander = () => {
  const chart = useChart()
  const expanded = useAttributeValue("expanded")
  const drawerAction = useAttributeValue("drawer.action", "values")

  const expandTooltip = expanded
    ? "Collapse to hide chart analysis tools"
    : `Expand to access chart analysis tools - ${actionDescriptions[drawerAction]}`

  return (
    <Tooltip content={expandTooltip}>
      <Container
        data-noprint
        cursor="pointer"
        onClick={() => chart.updateAttribute("expanded", !expanded)}
        alignSelf="center"
      >
        <Icon
          svg={chevronExpand}
          color="textLite"
          width="7.5px"
          height="5px"
          rotate={expanded ? 2 : 0}
        />
        <TextSmall color="textLite">
          {expanded
            ? "Collapse"
            : `Expand - ${drawerAction === "values" ? "Chart Analysis" : drawerAction === "drillDown" ? "Drill Down" : drawerAction === "compare" ? "Compare Periods" : "Find Correlations"}`}
        </TextSmall>
        <Icon
          svg={chevronExpand}
          color="textLite"
          width="7.5px"
          height="5px"
          rotate={expanded ? 2 : 0}
        />
      </Container>
    </Tooltip>
  )
}

export default Expander
