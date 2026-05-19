import React from "react"
import { Flex } from "@netdata/netdata-ui"
import ChartType from "./chartType"
import ChartElements from "../chartElements"
import ValueRange from "../valueRange"
import NumberFormat from "../numberFormat"

const DisplayBody = () => (
  <Flex column gap={3} padding={[3]} width={{ min: "260px" }}>
    <ChartType />
    <ChartElements />
    <ValueRange />
    <NumberFormat />
  </Flex>
)

export default {
  id: "display",
  label: "Display",
  Component: DisplayBody,
  resetKeys: [
    "chartType",
    "chartLibrary",
    "enabledYAxis",
    "enabledXAxis",
    "legend",
    "staticValueRange",
    "desiredUnits",
    "staticFractionDigits",
  ],
}
