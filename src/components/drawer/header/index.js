import React from "react"
import { Flex, Button } from "@netdata/netdata-ui"
import { useChart, useAttributeValue } from "@/components/provider"
import { actions, tabs } from "../constants"

const SelectedAreaButton = ({ chart, selected }) => {
  const { highlight } = useAttributeValue("overlays")
  const range = highlight?.range
  const { after } = highlight?.moveX ?? {}

  return (
    <Button
      tiny
      neutral={!selected}
      label="Selected area"
      disabled={!range || !after}
      onClick={() => chart.updateAttribute("drawerTab", tabs.selectedArea)}
    />
  )
}

const Header = ({ onClick, ...rest }) => {
  const chart = useChart()
  const action = useAttributeValue("drawerAction")
  const tab = useAttributeValue("drawerTab")

  return (
    <Flex justifyContent="between" data-noprint {...rest}>
      <Flex gap={6}>
        <Flex gap={1}>
          <Button
            tiny
            neutral={actions.values !== action}
            icon="line_chart"
            onClick={() => chart.updateAttribute("drawerAction", actions.values)}
          />
          <Button
            tiny
            neutral={actions.drillDown !== action}
            icon="weights_drill_down"
            onClick={() => chart.updateAttribute("drawerAction", actions.drillDown)}
          />
          <Button
            tiny
            neutral={actions.compare !== action}
            icon="weights_compare"
            onClick={() => chart.updateAttribute("drawerAction", actions.compare)}
          />
          <Button
            tiny
            neutral={actions.correlate !== action}
            icon="correlation_inv"
            onClick={() => chart.updateAttribute("drawerAction", actions.correlate)}
          />
        </Flex>
        <Flex gap={1}>
          <Button
            tiny
            neutral={tabs.window !== tab}
            label="Window"
            onClick={() => chart.updateAttribute("drawerTab", tabs.window)}
          />
          <SelectedAreaButton chart={chart} selected={tabs.selectedArea === tab} />
          {/*<Button
            tiny
            neutral={tabs.point !== tab}
            label="Point"
            disabled
            onClick={() => chart.updateAttribute("drawerTab", tabs.point)}
          />*/}
        </Flex>
      </Flex>
    </Flex>
  )
}

export default Header
