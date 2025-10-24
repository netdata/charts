import React, { useState } from "react"
import { Flex, TextSmall, TextMicro, Button } from "@netdata/netdata-ui"
import styled from "styled-components"
import Tooltip from "@/components/tooltip"
import Icon, { Button as IconButton } from "@/components/icon"
import useData from "./useData"
import { useChart, convert, useAttributeValue } from "@/components/provider"
import pencilIcon from "@netdata/netdata-ui/dist/components/icon/assets/pencil_outline.svg"
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

const StatRow = ({ label, value, change, valueKey = "value", tab, tooltip }) => {
  const chart = useChart()
  const formattedValue = convert(chart, value, { valueKey, fractionDigits: 2 })

  return (
    <Flex justifyContent="between" alignItems="center">
      <Tooltip content={tooltip}>
        <TextMicro>{label}</TextMicro>
      </Tooltip>
      <Flex alignItems="center" gap={1} flex="1 1 auto" justifyContent="end">
        <TextMicro textAlign="right">{formattedValue}</TextMicro>

        <ChangeIndicator change={change} tab={tab} />
      </Flex>
    </Flex>
  )
}

const basicStats = [
  { key: "min", label: "Min", tooltip: "Minimum value in the time period" },
  { key: "avg", label: "Avg", tooltip: "Average (mean) value in the time period" },
  { key: "max", label: "Max", tooltip: "Maximum value in the time period" },
]

const advancedStats = [
  { key: "median", label: "Median", tooltip: "Middle value when sorted (50th percentile)" },
  {
    key: "stddev",
    label: "StdDev",
    tooltip: "Standard deviation - measures data spread around the mean",
  },
  { key: "p95", label: "P95", tooltip: "95th percentile - 95% of values are below this" },
  { key: "range", label: "Range", tooltip: "Difference between maximum and minimum values" },
  { key: "volume", label: "Volume", tooltip: "Sum of all values in the time period" },
]

const ComparisonCard = ({ period, showAdvanced, tab }) => {
  const chart = useChart()
  const dateRange = formatDateRange(chart, period.after, period.before)
  const hasData = period.payload && period.stats && !period.error

  const [showEditForm, setShowEditForm] = useState(false)

  const updatePeriod = updated => {
    const currentCustomPeriods = chart.getAttribute("customPeriods", [])

    const updatedPeriods = currentCustomPeriods.map(p => (p.id === updated.id ? updated : p))
    chart.updateAttribute("customPeriods", updatedPeriods)
    setShowEditForm(false)
  }

  return (
    <Flex column gap={2} padding={[3]} border="all" round>
      <Tooltip content={dateRange}>
        <Flex alignItems="center" gap={1} justifyContent="between">
          <TextSmall strong>{period.label}</TextSmall>
          {!period.isBase && (
            <IconButton
              icon={<Icon svg={pencilIcon} size="10px" />}
              onClick={() => setShowEditForm(true)}
              data-testid="period-edit"
              data-track={chart.track("period-edit")}
            />
          )}
        </Flex>
      </Tooltip>

      {!hasData ? (
        <Flex column gap={1}>
          <TextMicro color="textDescription">
            {period.error ? "Error loading data" : "No data available for the selected time range"}
          </TextMicro>
        </Flex>
      ) : showEditForm ? (
        <CustomPeriodForm
          initialValues={period}
          onSubmit={updatePeriod}
          onCancel={() => setShowEditForm(false)}
        />
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
              tooltip={stat.tooltip}
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
                tooltip={stat.tooltip}
              />
            ))}
        </Flex>
      )}
    </Flex>
  )
}

const Compare = () => {
  const chart = useChart()
  const { periods, loading, error } = useData()
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
      <GridContainer>
        {periods.map(period => (
          <ComparisonCard key={period.id} period={period} showAdvanced={showAllStats} tab={tab} />
        ))}

        {!showCustomForm ? (
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
            <Tooltip content="Add a custom time period for comparison - Choose any specific date range to compare with the current view">
              <Button tiny label="Select a timeframe" onClick={() => setShowCustomForm(true)} />
            </Tooltip>
          </Flex>
        ) : (
          <CustomPeriodForm onSubmit={addCustomPeriod} onCancel={() => setShowCustomForm(false)} />
        )}
      </GridContainer>
    </Flex>
  )
}

export default Compare
