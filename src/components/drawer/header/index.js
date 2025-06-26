import React from "react"
import { Flex, Button } from "@netdata/netdata-ui"
import Icon, { Button as IconButton } from "@/components/icon"
import { useChart, useAttributeValue } from "@/components/provider"
import { actions, tabs } from "../constants"
import metricsIcon from "@netdata/netdata-ui/dist/components/icon/assets/metrics.svg"

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
      onClick={() => chart.updateAttribute("drawer.tab", tabs.selectedArea)}
    />
  )
}

const Header = ({ onClick, ...rest }) => {
  const chart = useChart()
  const action = useAttributeValue("drawer.action", "values")
  const tab = useAttributeValue("drawer.tab", "window")
  const showAdvancedStats = useAttributeValue("drawer.showAdvancedStats", false)

  return (
    <Flex justifyContent="between" data-noprint {...rest}>
      <Flex gap={6}>
        <Flex gap={1}>
          <Button
            tiny
            neutral={actions.values !== action}
            icon="line_chart"
            onClick={() => chart.updateAttribute("drawer.action", actions.values)}
          />
          <Button
            tiny
            neutral={actions.drillDown !== action}
            icon="weights_drill_down"
            onClick={() => chart.updateAttribute("drawer.action", actions.drillDown)}
          />
          <Button
            tiny
            neutral={actions.compare !== action}
            icon="weights_compare"
            onClick={() => chart.updateAttribute("drawer.action", actions.compare)}
          />
          <Button
            tiny
            neutral={actions.correlate !== action}
            icon="correlation_inv"
            onClick={() => chart.updateAttribute("drawer.action", actions.correlate)}
          />
        </Flex>
        <Flex gap={1}>
          <Button
            tiny
            neutral={tabs.window !== tab}
            label="Window"
            onClick={() => chart.updateAttribute("drawer.tab", tabs.window)}
          />
          <SelectedAreaButton chart={chart} selected={tabs.selectedArea === tab} />
          {/*<Button
            tiny
            neutral={tabs.point !== tab}
            label="Point"
            disabled
            onClick={() => chart.updateAttribute("drawer.tab", tabs.point)}
          />*/}
        </Flex>
      </Flex>
      <Flex>
        <IconButton
          icon={<Icon svg={metricsIcon} size="16px" />}
          title="Show all statistics"
          active={showAdvancedStats}
          onClick={() => chart.updateAttribute("drawer.showAdvancedStats", !showAdvancedStats)}
          data-testid="drawer-header-advanced-stats"
        />
      </Flex>
    </Flex>
  )
}

export default Header
