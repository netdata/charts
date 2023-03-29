import React from "react"
import styled from "styled-components"
import { Flex, Button } from "@netdata/netdata-ui"
import { useChart, useAttributeValue } from "@/components/provider"
import { actions, tabs } from "../constants"

const Header = ({ onClick, ...rest }) => {
  const chart = useChart()
  const action = useAttributeValue("weightsAction")
  const tab = useAttributeValue("weightsTab")

  return (
    <Flex justifyContent="between" {...rest}>
      <Flex gap={6}>
        <Flex gap={1}>
          <Button
            tiny
            neutral={actions.values !== action}
            icon="line_chart"
            onClick={() => chart.updateAttribute("weightsAction", actions.values)}
          />
          <Button
            tiny
            neutral={actions.drillDown !== action}
            icon="weights_drill_down"
            onClick={() => chart.updateAttribute("weightsAction", actions.drillDown)}
          />
          <Button
            tiny
            neutral={actions.compare !== action}
            icon="weights_compare"
            onClick={() => chart.updateAttribute("weightsAction", actions.compare)}
          />
          <Button
            tiny
            neutral={actions.correlate !== action}
            icon="correlation_inv"
            onClick={() => chart.updateAttribute("weightsAction", actions.correlate)}
          />
        </Flex>
        <Flex gap={1}>
          <Button
            tiny
            neutral={tabs.window !== tab}
            label="Window"
            onClick={() => chart.updateAttribute("weightsTab", tabs.window)}
          />
          <Button
            tiny
            neutral={tabs.selectedArea !== tab}
            label="Selected area"
            disabled
            onClick={() => chart.updateAttribute("weightsTab", tabs.selectedArea)}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}

export default Header
