import React from "react"
import { Flex } from "@netdata/netdata-ui"
import DisplayChartType from "./displayChartType"
import ChartElements from "../chartElements"
import ValueRange from "../valueRange"
import NumberFormat from "../numberFormat"

const DisplayBody = ({ formState, onChange }) => (
  <Flex column gap={3} padding={[3]} width={{ min: "260px" }}>
    <DisplayChartType
      value={{ chartLibrary: formState.chartLibrary, chartType: formState.chartType }}
      onChange={onChange}
    />
    <ChartElements formState={formState} onChange={onChange} />
    <ValueRange formState={formState} onChange={onChange} />
    <NumberFormat formState={formState} onChange={onChange} />
  </Flex>
)

export default { id: "display", label: "Display", Component: DisplayBody }
