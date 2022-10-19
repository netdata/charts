import React, { memo, useMemo } from "react"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { useAttributeValue, useChart, usePayload } from "@/components/provider"
import Label from "./label"

const useMenuItems = chart =>
  useMemo(
    () => [
      {
        value: "min",
        label: "Min",
        short: "MIN()",
        "data-track": chart.track("time-aggregation-min"),
      },
      {
        value: "max",
        label: "Max",
        short: "MAX()",
        "data-track": chart.track("time-aggregation-max"),
      },
      {
        value: "average",
        label: "Average",
        short: "AVG()",
        "data-track": chart.track("time-aggregation-average"),
      },
      {
        value: "sum",
        label: "Sum",
        short: "SUM()",
        "data-track": chart.track("time-aggregation-sum"),
      },
      {
        value: "incremental-sum",
        label: "Incremental sum (Delta)",
        short: "DELTA()",
        "data-track": chart.track("time-aggregation-incremental-sum"),
      },
      {
        value: "stddev",
        label: "Standard deviation",
        short: "STDDEV()",
        "data-track": chart.track("time-aggregation-stddev"),
      },
      {
        value: "median",
        label: "Median",
        short: "MEDIAN()",
        "data-track": chart.track("time-aggregation-median"),
      },
      {
        value: "ses",
        label: "Single exponential smoothing",
        short: "SES()",
        "data-track": chart.track("time-aggregation-ses"),
      },
      {
        value: "des",
        label: "Double exponential smoothing",
        short: "DES()",
        "data-track": chart.track("time-aggregation-des"),
      },
      {
        value: "cv",
        label: "Coefficient variation",
        short: "CV()",
        "data-track": chart.track("time-aggregation-cv"),
      },
      {
        value: "trimmed-median",
        label: "Trimmed Median",
        short: "TRIMMEDIAN()",
        "data-track": chart.track("time-aggregation-trimmed-median5"),
      },
      {
        value: "trimmed-mean",
        label: "Trimmed Mean",
        short: "TRIMMEAN()",
        "data-track": chart.track("time-aggregation-trimmed-mean5"),
      },
      {
        value: "percentile",
        label: "Percentile",
        short: "PERCENTILE()",
        "data-track": chart.track("time-aggregation-percentile95"),
      },
    ],
    [chart]
  )

const useMenuAliasItems = ({ chart, method }) =>
  useMemo(
    () => {
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
    },
    [chart, method]
  )

const defaultAliases = {
  percentile: "95",
  "trimmed-mean": "5",
  "trimmed-median": "5",
}
const aliasTooltipProps = {
  heading: "Aggregation function aliases over time",
  body: "The percentile or percentage of the data you want to focus for the percentile or trimmed functions selected."
}
const methodTooltipProps = {
  heading: "Aggregation function over time",
  body: "The aggregation function over time, for each of the metrics contributing to this query",
}

const TimeAggregation = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const groupingMethod = useAttributeValue("groupingMethod")
  const [method, alias] = groupingMethod.match(/[\d.]+|\D+/g)
  const { viewUpdateEvery = 0 } = usePayload()

  const items = useMenuItems(chart)
  const aliasItems = useMenuAliasItems({ chart, method})

  const { short } = items.find(item => item.value === method) || items[0]
  const aliasItem = aliasItems.find(item => item.value === alias) || aliasItems[0]

  const handleAliasChange = value => chart.updateTimeAggregationMethodAttribute({ alias: value, method })
  const handleMethodChange = value => chart.updateTimeAggregationMethodAttribute({ alias: defaultAliases[value], method: value, })

  return (
    <>
      {alias && (
        <Menu
          value={alias}
          onChange={handleAliasChange}
          items={aliasItems}
          data-track={chart.track("groupingMethod")}
          dropProps={{ align: { top: "bottom", left: "left" }, "data-toolbox": true }}
          {...rest}
        >
          <Label
            label={aliasItem.short}
            secondaryLabel="each as"
            title={aliasTooltipProps.heading}
            tooltipProps={aliasTooltipProps}
            {...labelProps}
          />
        </Menu>
      )}
      <Menu
        value={method}
        onChange={handleMethodChange}
        items={items}
        data-track={chart.track("groupingMethod")}
        dropProps={{ align: { top: "bottom", left: "left" }, "data-toolbox": true }}
        {...rest}
      >
        <Label
          label={short}
          secondaryLabel={!alias && "each as"}
          tertiaryLabel={`every ${viewUpdateEvery}s`}
          title={methodTooltipProps.heading}
          tooltipProps={methodTooltipProps}
          {...labelProps}
        />
      </Menu>
    </>
  )
}

export default memo(TimeAggregation)
