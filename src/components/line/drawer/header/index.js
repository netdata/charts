import React from "react"
import styled from "styled-components"
import { Flex, Button } from "@netdata/netdata-ui"
import { useChart, useAttributeValue } from "@/components/provider"
import GridItem from "../gridItem"

const Container = styled(GridItem).attrs({
  area: "header",
  justifyContent: "between",
})`
  &::-webkit-scrollbar {
    height: 0;
  }
`

const actions = {
  values: "values",
  drillDown: "drillDown",
  compare: "compare",
  correlate: "correlate",
}

const tabs = {
  window: "window",
  selectedArea: "selectedArea",
  selectedPoint: "selectedPoint",
  highlighted: "highlighted",
  latest: "latest",
}

const Header = ({ onClick, ...rest }) => {
  const chart = useChart()
  const action = useAttributeValue("weightsAction")
  const tab = useAttributeValue("weightsTab")

  return (
    <Container {...rest}>
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
          <Button
            tiny
            neutral={tabs.selectedPoint !== tab}
            label="Selected point"
            disabled
            onClick={() => chart.updateAttribute("weightsTab", tabs.selectedPoint)}
          />
          <Button
            tiny
            neutral={tabs.highlighted !== tab}
            label="Highlighted"
            disabled
            onClick={() => chart.updateAttribute("weightsTab", tabs.highlighted)}
          />
          <Button
            tiny
            neutral={tabs.latest !== tab}
            label="Latest"
            disabled
            onClick={() => chart.updateAttribute("weightsTab", tabs.latest)}
          />
        </Flex>
      </Flex>
    </Container>
  )
}

export default Header
