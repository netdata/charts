import React from "react"
import { Flex, Button, IconButton } from "@netdata/netdata-ui"
import Tooltip from "@/components/tooltip"
import { useChart, useAttributeValue } from "@/components/provider"
import { actions, tabs } from "../constants"

const supportsAdvancedStats = {
  values: true,
  drillDown: false,
  compare: true,
  correlate: false,
}

const SelectedAreaButton = ({ chart, selected }) => {
  const { highlight } = useAttributeValue("overlays")
  const range = highlight?.range

  return (
    <Tooltip content={range ? "Selected Area - Analyze data for the highlighted time range" : "Select an area on the chart to enable this option"}>
      <Button
        neutral={!selected}
        label="Selected area"
        disabled={!range}
        onClick={() => chart.updateAttribute("drawer.tab", tabs.selectedArea)}
      />
    </Tooltip>
  )
}

const Header = rest => {
  const chart = useChart()
  const action = useAttributeValue("drawer.action", "compare")
  const tab = useAttributeValue("drawer.tab", "window")
  const showAdvancedStats = useAttributeValue("drawer.showAdvancedStats", false)

  return (
    <Flex justifyContent="between" gap={1} flexWrap data-noprint {...rest}>
      <Flex gap={6} flexWrap>
        <Flex gap={1} flexWrap>
          <Tooltip content="Compare - Compare current data with different time periods or baselines">
            <Button
              neutral={actions.compare !== action}
              icon="weights_compare"
              label="Compare"
              onClick={() => chart.updateAttribute("drawer.action", actions.compare)}
            />
          </Tooltip>
          <Tooltip content="Chart Values - View dimension values, statistics, and time ranges">
            <Button
              neutral={actions.values !== action}
              icon="line_chart"
              label="Values"
              onClick={() => chart.updateAttribute("drawer.action", actions.values)}
            />
          </Tooltip>
          <Tooltip content="Drill Down - Explore related metrics and child contexts using weights analysis">
            <Button
              neutral={actions.drillDown !== action}
              icon="weights_drill_down"
              label="Drill Down"
              onClick={() => chart.updateAttribute("drawer.action", actions.drillDown)}
            />
          </Tooltip>
          <Tooltip content="Correlate - Find metrics that correlate with the current chart's behavior">
            <Button
              neutral={actions.correlate !== action}
              icon="correlation_inv"
              label="Correlate"
              onClick={() => chart.updateAttribute("drawer.action", actions.correlate)}
            />
          </Tooltip>
        </Flex>
        <Flex gap={1}>
          <Tooltip content="Window - Analyze data for the entire visible time window">
            <Button
              neutral={tabs.window !== tab}
              label="Window"
              onClick={() => chart.updateAttribute("drawer.tab", tabs.window)}
            />
          </Tooltip>
          <SelectedAreaButton chart={chart} selected={tabs.selectedArea === tab} />
          {/*<Button
            neutral={tabs.point !== tab}
            label="Point"
            disabled
            onClick={() => chart.updateAttribute("drawer.tab", tabs.point)}
          />*/}
        </Flex>
      </Flex>
      {supportsAdvancedStats[action] && (
        <Flex>
          <IconButton
            icon="metrics"
            width="16px"
            height="16px"
            tooltip={
              showAdvancedStats
                ? "Hide advanced statistics - Click to show only basic stats"
                : "Show advanced statistics - Click to display detailed metrics including min, max, avg, and more"
            }
            active={showAdvancedStats}
            onClick={() => chart.updateAttribute("drawer.showAdvancedStats", !showAdvancedStats)}
            data-testid="drawer-header-advanced-stats"
          />
        </Flex>
      )}
    </Flex>
  )
}

export default Header
