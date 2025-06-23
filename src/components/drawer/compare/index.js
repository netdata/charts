import React, { useState } from "react"
import { Flex, TextSmall, TextMicro, Button } from "@netdata/netdata-ui"
import { useComparisonData } from "./useComparisonData"
import { useChart } from "@/components/provider"
import ChangeIndicator from "./changeIndicator"
import CustomPeriodForm from "./customPeriodForm"

const formatDateRange = (chart, after, before) => {
  const afterDate = new Date(after * 1000)
  const beforeDate = new Date(before * 1000)
  return `${chart.formatDate(afterDate)} ${chart.formatTime(afterDate)} → ${chart.formatDate(beforeDate)} ${chart.formatTime(beforeDate)}`
}

const formatValue = value => {
  if (value == null) return "N/A"
  if (typeof value === "number") {
    return value.toFixed(2)
  }
  return value.toString()
}

const ComparisonCard = ({ period }) => {
  const chart = useChart()
  const dateRange = formatDateRange(chart, period.after, period.before)
  const hasData = period.payload && period.stats && !period.error

  return (
    <Flex column gap={2} padding={[3]} border="all" round width={{ min: "200px" }}>
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
          <Flex justifyContent="between">
            <TextMicro>Min</TextMicro>
            <Flex alignItems="center" gap={1}>
              <TextMicro>{formatValue(period.stats.min)}</TextMicro>
              <ChangeIndicator change={period.changes?.min} />
            </Flex>
          </Flex>
          <Flex justifyContent="between">
            <TextMicro>Avg</TextMicro>
            <Flex alignItems="center" gap={1}>
              <TextMicro>{formatValue(period.stats.avg)}</TextMicro>
              <ChangeIndicator change={period.changes?.avg} />
            </Flex>
          </Flex>
          <Flex justifyContent="between">
            <TextMicro>Max</TextMicro>
            <Flex alignItems="center" gap={1}>
              <TextMicro>{formatValue(period.stats.max)}</TextMicro>
              <ChangeIndicator change={period.changes?.max} />
            </Flex>
          </Flex>
          <Flex justifyContent="between">
            <TextMicro>Data Points</TextMicro>
            <Flex alignItems="center" gap={1}>
              <TextMicro>{period.stats.points}</TextMicro>
              <ChangeIndicator change={period.changes?.points} />
            </Flex>
          </Flex>
          <Flex justifyContent="between">
            <TextMicro>Dimensions</TextMicro>
            <Flex alignItems="center" gap={1}>
              <TextMicro>{period.stats.dimensions}</TextMicro>
              <ChangeIndicator change={period.changes?.dimensions} />
            </Flex>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}

const Compare = () => {
  const chart = useChart()
  const { periods, loading, error } = useComparisonData()
  const [showCustomForm, setShowCustomForm] = useState(false)

  const addCustomPeriod = (customPeriod) => {
    const currentCustomPeriods = chart.getAttribute("customPeriods") || []
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

      <Flex gap={3} overflow={{ horizontal: "scroll" }}>
        {periods.map(period => (
          <ComparisonCard key={period.id} period={period} />
        ))}

        {periods.length > 0 && !showCustomForm && (
          <Flex
            column
            gap={2}
            padding={[3]}
            border={{ side: "all", type: "dashed" }}
            round
            width={{ min: "200px" }}
            alignItems="center"
            justifyContent="center"
          >
            <TextSmall>Custom</TextSmall>
            <Button tiny label="Select a timeframe" onClick={() => setShowCustomForm(true)} />
          </Flex>
        )}

        {showCustomForm && (
          <CustomPeriodForm
            onAdd={addCustomPeriod}
            onCancel={() => setShowCustomForm(false)}
          />
        )}
      </Flex>
    </Flex>
  )
}

export default Compare
