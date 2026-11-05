import React from "react"
import { Flex, TextSmall, Select } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"
import TimeAggregation from "./timeAggregation"
import PointsToFetch from "../pointsToFetch"

const nullHandlingOptions = [
  { value: false, label: "Show gaps" },
  { value: true, label: "Treat as zero" },
]

const NullHandling = () => {
  const chart = useChart()
  const nulls2zero = useAttributeValue("nulls2zero")
  const current =
    nullHandlingOptions.find(o => o.value === !!nulls2zero) || nullHandlingOptions[0]

  const handleChange = option => {
    chart.updateAttributes({ nulls2zero: !!option?.value })
    chart.trigger("fetch", { processing: true })
  }

  return (
    <Flex column gap={2}>
      <TextSmall color="textNoFocus" strong>
        Null handling
      </TextSmall>
      <Select
        value={current}
        onChange={handleChange}
        options={nullHandlingOptions}
        data-testid="chartSettings-nullHandling"
      />
    </Flex>
  )
}

const DataBody = () => (
  <Flex column gap={3} padding={[3]} width={{ min: "260px" }}>
    <TimeAggregation />
    <NullHandling />
    <PointsToFetch />
  </Flex>
)

export default {
  id: "data",
  label: "Data",
  Component: DataBody,
  resetKeys: ["groupingMethod", "nulls2zero", "points"],
}
