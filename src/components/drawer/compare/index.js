import React, { useState } from "react"
import { Flex, TextSmall, TextMicro, Button, Icon } from "@netdata/netdata-ui"
import styled from "styled-components"
import { useComparisonData } from "./useComparisonData"
import { useChart, convert, useAttributeValue } from "@/components/provider"
import ChangeIndicator from "./changeIndicator"
import CustomPeriodForm from "./customPeriodForm"

const GridContainer = styled(Flex)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
`

const formatDateRange = (chart, after, before) => {
  const afterDate = new Date(after * 1000)
  const beforeDate = new Date(before * 1000)
  return `${chart.formatDate(afterDate)} ${chart.formatTime(afterDate)} → ${chart.formatDate(beforeDate)} ${chart.formatTime(beforeDate)}`
}

const StatRow = ({ label, value, change, valueKey = "value", tab }) => {
  const chart = useChart()
  const formattedValue = convert(chart, value, { valueKey, fractionDigits: 2 })

  return (
    <Flex justifyContent="between" alignItems="center">
      <TextMicro>{label}</TextMicro>
      <Flex alignItems="center" gap={1} flex="1 1 auto" justifyContent="end">
        <TextMicro textAlign="right">{formattedValue}</TextMicro>

        <ChangeIndicator change={change} tab={tab} />
      </Flex>
    </Flex>
  )
}

const basicStats = [
  { key: "min", label: "Min" },
  { key: "avg", label: "Avg" },
  { key: "max", label: "Max" },
]

const advancedStats = [
  { key: "median", label: "Median" },
  { key: "stddev", label: "StdDev" },
  { key: "p95", label: "P95" },
  { key: "range", label: "Range" },
  { key: "volume", label: "Volume" },
]

const ComparisonCard = ({ period, showAdvanced, tab }) => {
  const chart = useChart()
  const dateRange = formatDateRange(chart, period.after, period.before)
  const hasData = period.payload && period.stats && !period.error

  return (
    <Flex column gap={2} padding={[3]} border="all" round>
      <Flex column gap={1}>
        <TextSmall strong>{period.label}</TextSmall>
        <TextMicro color="textDescription">{dateRange}</TextMicro>
      </Flex>

      {!hasData ? (
        <Flex column gap={1}>
          <TextMicro color="textDescription">
            {period.error ? "Error loading data" : "Loading..."}
          </TextMicro>
        </Flex>
      ) : (
        <Flex column gap={1}>
          {basicStats.map(stat => (
            <StatRow
              key={stat.key}
              label={stat.label}
              value={period.stats[stat.key]}
              change={period.changes?.[stat.key]}
              valueKey={stat.key}
              tab={tab}
            />
          ))}

          {showAdvanced &&
            advancedStats.map(stat => (
              <StatRow
                key={stat.key}
                label={stat.label}
                value={period.stats[stat.key]}
                change={period.changes?.[stat.key]}
                valueKey={stat.key}
                tab={tab}
              />
            ))}
        </Flex>
      )}
    </Flex>
  )
}

const Compare = () => {
  const chart = useChart()
  const { periods, loading, error } = useComparisonData()
  const [showCustomForm, setShowCustomForm] = useState(false)
  const showAllStats = useAttributeValue("drawer.showAdvancedStats", false)
  const tab = useAttributeValue("drawer.tab", "window")

  const addCustomPeriod = customPeriod => {
    const currentCustomPeriods = chart.getAttribute("customPeriods", [])
    chart.updateAttribute("customPeriods", [...currentCustomPeriods, customPeriod])
    setShowCustomForm(false)
  }

  if (error) {
    return (
      <Flex column gap={3}>
        <TextMicro color="error">Error: {error}</TextMicro>
      </Flex>
    )
  }

  return (
    <Flex column gap={3}>
      {loading && <TextMicro color="textDescription">Loading comparison data...</TextMicro>}

      <GridContainer>
        {periods.map(period => (
          <ComparisonCard key={period.id} period={period} showAdvanced={showAllStats} tab={tab} />
        ))}

        {periods.length > 0 && !showCustomForm && (
          <Flex
            column
            gap={2}
            padding={[3]}
            border={{ side: "all", type: "dashed" }}
            round
            alignItems="center"
            justifyContent="center"
            height={{ min: "142px" }}
          >
            <TextSmall>Custom</TextSmall>
            <Button tiny label="Select a timeframe" onClick={() => setShowCustomForm(true)} />
          </Flex>
        )}

        {showCustomForm && (
          <CustomPeriodForm onAdd={addCustomPeriod} onCancel={() => setShowCustomForm(false)} />
        )}
      </GridContainer>
    </Flex>
  )
}

export default Compare
