import React from "react"
import { Flex, TextSmall, Select, InputRange } from "@netdata/netdata-ui"
import Tooltip from "@/components/tooltip"
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
        <Tooltip content="Algorithm used to calculate correlation strength.\nVolume: Percentage change between periods\nKS2: Statistical distribution comparison">
          <TextSmall>
            Method:
          </TextSmall>
        </Tooltip>
        <Select
          options={methodOptions}
          value={selectedMethod}
          onChange={({ value }) => chart.updateAttribute("correlate.method", value)}
          styles={{ size: "tiny" }}
        />

        <Tooltip content="How to aggregate data points within the time period.\nAffects how metrics are summarized before correlation calculation.">
          <TextSmall>
            Aggregation:
          </TextSmall>
        </Tooltip>
        <Select
          options={aggregationOptions}
          value={selectedAggregation}
          onChange={({ value }) => chart.updateAttribute("correlate.aggregation", value)}
          styles={{ size: "tiny" }}
        />

        <Tooltip content="Type of data to correlate.\nMetrics: Actual metric values\nAnomaly Rate: Anomaly detection patterns">
          <TextSmall>
            Data:
          </TextSmall>
        </Tooltip>
        <Select
          options={dataTypeOptions}
          value={selectedDataType}
          onChange={({ value }) => chart.updateAttribute("correlate.dataType", value)}
          styles={{ size: "tiny" }}
        />
      </Flex>

      <Flex gap={2} alignItems="center">
        <Tooltip content="Filter to show only metrics with correlation weight below this threshold.\nLower threshold = show only strongest correlations.\n1% shows only metrics with <1% weight (very strong correlations).">
          <TextSmall>
            Show top:
          </TextSmall>
        </Tooltip>
        <Flex flex={1}>
          <Tooltip content={`Currently showing metrics with correlation weight < ${(threshold * 100).toFixed(0)}%`}>
            <InputRange
              min={0.01}
              max={1}
              step={0.01}
              value={threshold}
              onChange={e => chart.updateAttribute("correlate.threshold", parseFloat(e.target.value))}
            />
          </Tooltip>
        </Flex>
        <Tooltip content={`Showing metrics with correlation weight < ${(threshold * 100).toFixed(0)}%`}>
          <TextSmall>
            {(threshold * 100).toFixed(0)}%
          </TextSmall>
        </Tooltip>
      </Flex>
    </Flex>
  )
}

export default Controls
