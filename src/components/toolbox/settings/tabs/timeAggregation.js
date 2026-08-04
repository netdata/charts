import React, { memo, useMemo } from "react"
import { Flex, TextSmall, Select } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"
import { useMenuItems } from "@/components/filterToolbox/timeAggregation"

const useMenuAliasItems = ({ chart, method }) =>
  useMemo(() => {
    if (method === "percentile") {
      return [
        {
          value: "25",
          label: "25th",
          short: "25th",
          "data-track": chart.track("time-aggregation-percentile25"),
        },
        {
          value: "50",
          label: "50th",
          short: "50th",
          "data-track": chart.track("time-aggregation-percentile50"),
        },
        {
          value: "75",
          label: "75th",
          short: "75th",
          "data-track": chart.track("time-aggregation-percentile75"),
        },
        {
          value: "80",
          label: "80th",
          short: "80th",
          "data-track": chart.track("time-aggregation-percentile80"),
        },
        {
          value: "90",
          label: "90th",
          short: "90th",
          "data-track": chart.track("time-aggregation-percentile90"),
        },
        {
          value: "95",
          label: "95th",
          short: "95th",
          "data-track": chart.track("time-aggregation-percentile95"),
        },
        {
          value: "97",
          label: "97th",
          short: "97th",
          "data-track": chart.track("time-aggregation-percentile97"),
        },
        {
          value: "98",
          label: "98th",
          short: "98th",
          "data-track": chart.track("time-aggregation-percentile98"),
        },
        {
          value: "99",
          label: "99th",
          short: "99th",
          "data-track": chart.track("time-aggregation-percentile99"),
        },
      ]
    }

    if (method.includes("trimmed")) {
      return [
        {
          value: "1",
          label: "1%",
          short: "1%",
          "data-track": chart.track(`time-aggregation-${method}1`),
        },
        {
          value: "2",
          label: "2%",
          short: "2%",
          "data-track": chart.track(`time-aggregation-${method}2`),
        },
        {
          value: "3",
          label: "3%",
          short: "3%",
          "data-track": chart.track(`time-aggregation-${method}3`),
        },
        {
          value: "5",
          label: "5%",
          short: "5%",
          "data-track": chart.track(`time-aggregation-${method}5`),
        },
        {
          value: "10",
          label: "10%",
          short: "10%",
          "data-track": chart.track(`time-aggregation-${method}10`),
        },
        {
          value: "15",
          label: "15%",
          short: "15%",
          "data-track": chart.track(`time-aggregation-${method}15`),
        },
        {
          value: "20",
          label: "20%",
          short: "20%",
          "data-track": chart.track(`time-aggregation-${method}20`),
        },
        {
          value: "25",
          label: "25%",
          short: "25%",
          "data-track": chart.track(`time-aggregation-${method}25`),
        },
      ]
    }

    return []
  }, [chart, method])

const defaultAliases = {
  percentile: "95",
  "trimmed-mean": "5",
  "trimmed-median": "5",
}

const aliasTooltipProps = {
  heading: "Aliases aggregation over time",
  body: "The percentile or percentage of the data you want to focus for the percentile or trimmed functions selected.",
}

const methodTooltipProps = {
  heading: "Time aggregation",
  body: "View or select the aggregation function applied on each time-series metric when the number of points in the database are more than the points your screen resolution provides to present this chart. This function is helpful when viewing long time-frames, like days, weeks or months, to quickly spot anomalies, spikes or dives.",
}

const toMethodAndAlias = groupingMethod => {
  const [method = "", alias = ""] = groupingMethod.match(/[\d.]+|\D+/g) || []
  return { method, alias }
}

export const composeGroupingMethod = ({ method, alias }) =>
  alias ? `${method}${alias}` : method

const TimeAggregation = () => {
  const chart = useChart()
  const groupingMethod = useAttributeValue("groupingMethod") || ""
  const { method, alias } = toMethodAndAlias(groupingMethod)

  const viewUpdateEvery = useAttributeValue("viewUpdateEvery")
  const perTier = useAttributeValue("perTier")

  const items = useMenuItems(chart, perTier)
  const aliasItems = useMenuAliasItems({ chart, method })

  const selectableMethodItems = useMemo(
    () => items.filter(i => !i.justDesc).map(({ value, label }) => ({ value, label })),
    [items]
  )

  const selectableAliasItems = useMemo(
    () => aliasItems.map(({ value, label }) => ({ value, label })),
    [aliasItems]
  )

  const currentMethodItem =
    selectableMethodItems.find(item => item.value === method) || selectableMethodItems[0]
  const currentAliasItem =
    selectableAliasItems.find(item => item.value === alias) || selectableAliasItems[0]

  const handleMethodChange = option => {
    const nextMethod = option?.value
    const nextAlias = defaultAliases[nextMethod] || ""
    chart.updateTimeAggregationMethodAttribute({ method: nextMethod, alias: nextAlias })
  }

  const handleAliasChange = option => {
    chart.updateTimeAggregationMethodAttribute({ method, alias: option?.value || "" })
  }

  return (
    <Flex column gap={2}>
      <TextSmall color="textNoFocus" strong title={methodTooltipProps.body}>
        Time aggregation
      </TextSmall>
      <Flex column gap={1}>
        <Select
          value={currentMethodItem}
          onChange={handleMethodChange}
          options={selectableMethodItems}
          data-track={chart.track("groupingMethod")}
          data-testid="chartSettings-timeAggregation-method"
        />
        {alias && (
          <Select
            value={currentAliasItem}
            onChange={handleAliasChange}
            options={selectableAliasItems}
            data-track={chart.track("groupingMethodAlias")}
            data-testid="chartSettings-timeAggregation-alias"
            placeholder={aliasTooltipProps.heading}
          />
        )}
        <TextSmall color="textLite">every {viewUpdateEvery}s</TextSmall>
      </Flex>
    </Flex>
  )
}

export default memo(TimeAggregation)
