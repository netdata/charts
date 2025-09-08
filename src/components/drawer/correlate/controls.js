import React from "react"
import { Flex, TextSmall, Select, InputRange } from "@netdata/netdata-ui"
import { useChart, useAttributeValue } from "@/components/provider"

const methodOptions = [
  { label: "Volume", value: "volume" },
  { label: "KS2", value: "ks2" },
]

const aggregationOptions = [
  { label: "Average", value: "average" },
  { label: "Median", value: "median" },
  { label: "Min", value: "min" },
  { label: "Max", value: "max" },
  { label: "StdDev", value: "stddev" },
]

const dataTypeOptions = [
  { label: "Metrics", value: "" },
  { label: "Anomaly Rate", value: "anomaly-bit" },
]

const Controls = () => {
  const chart = useChart()
  const method = useAttributeValue("correlate.method", "volume")
  const aggregation = useAttributeValue("correlate.aggregation", "average")
  const dataType = useAttributeValue("correlate.dataType", "")
  const threshold = useAttributeValue("correlate.threshold", 0.01)

  const selectedMethod = methodOptions.find(opt => opt.value === method)
  const selectedAggregation = aggregationOptions.find(opt => opt.value === aggregation)
  const selectedDataType = dataTypeOptions.find(opt => opt.value === dataType)

  return (
    <Flex column gap={2}>
      <Flex gap={2} alignItems="center">
        <TextSmall title="Algorithm used to calculate correlation strength.\nVolume: Percentage change between periods\nKS2: Statistical distribution comparison">
          Method:
        </TextSmall>
        <Select
          options={methodOptions}
          value={selectedMethod}
          onChange={({ value }) => chart.updateAttribute("correlate.method", value)}
          styles={{ size: "tiny" }}
        />

        <TextSmall title="How to aggregate data points within the time period.\nAffects how metrics are summarized before correlation calculation.">
          Aggregation:
        </TextSmall>
        <Select
          options={aggregationOptions}
          value={selectedAggregation}
          onChange={({ value }) => chart.updateAttribute("correlate.aggregation", value)}
          styles={{ size: "tiny" }}
        />

        <TextSmall title="Type of data to correlate.\nMetrics: Actual metric values\nAnomaly Rate: Anomaly detection patterns">
          Data:
        </TextSmall>
        <Select
          options={dataTypeOptions}
          value={selectedDataType}
          onChange={({ value }) => chart.updateAttribute("correlate.dataType", value)}
          styles={{ size: "tiny" }}
        />
      </Flex>

      <Flex gap={2} alignItems="center">
        <TextSmall title="Filter to show only metrics with correlation weight below this threshold.\nLower threshold = show only strongest correlations.\n1% shows only metrics with <1% weight (very strong correlations).">
          Show top:
        </TextSmall>
        <Flex flex={1}>
          <InputRange
            min={0.01}
            max={1}
            step={0.01}
            value={threshold}
            onChange={e => chart.updateAttribute("correlate.threshold", parseFloat(e.target.value))}
            title={`Currently showing metrics with correlation weight < ${(threshold * 100).toFixed(0)}%`}
          />
        </Flex>
        <TextSmall title={`Showing metrics with correlation weight < ${(threshold * 100).toFixed(0)}%`}>
          {(threshold * 100).toFixed(0)}%
        </TextSmall>
      </Flex>
    </Flex>
  )
}

export default Controls
