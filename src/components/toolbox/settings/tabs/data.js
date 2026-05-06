import React from "react"
import { Flex, TextSmall, Select } from "@netdata/netdata-ui"
import TimeAggregation from "./timeAggregation"
import PointsToFetch from "../pointsToFetch"

const nullHandlingOptions = [
  { value: false, label: "Show gaps" },
  { value: true, label: "Treat as zero" },
]

const NullHandling = ({ formState, onChange }) => {
  const current =
    nullHandlingOptions.find(o => o.value === !!formState.nulls2zero) || nullHandlingOptions[0]
  return (
    <Flex column gap={2}>
      <TextSmall color="textNoFocus" strong>
        Null handling
      </TextSmall>
      <Select
        value={current}
        onChange={option => onChange({ nulls2zero: !!option?.value })}
        options={nullHandlingOptions}
        data-testid="chartSettings-nullHandling"
      />
    </Flex>
  )
}

const DataBody = ({ formState, onChange }) => (
  <Flex column gap={3} padding={[3]} width={{ min: "260px" }}>
    <TimeAggregation
      value={formState.groupingMethod}
      onChange={value => onChange({ groupingMethod: value })}
    />
    <NullHandling formState={formState} onChange={onChange} />
    <PointsToFetch formState={formState} onChange={onChange} />
  </Flex>
)

export default { id: "data", label: "Data", Component: DataBody }
