import React, { memo, useMemo } from "react"
import { TextSmall } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"
import Dropdown from "./dropdownSingleSelect"

const useMenuItems = (chart, perTier = []) => {
  const [firstTier, ...restTiers] = perTier
  return useMemo(
    () =>
      [
        {
          value: "min",
          label: "Minimum",
          description: "Reveal short dives that would otherwise be smoothed out.",
          short: "MIN()",
          "data-track": chart.track("time-aggregation-min"),
        },
        {
          value: "max",
          label: "Maximum",
          description: "Reveal short spikes that would otherwise be smoothed out.",
          short: "MAX()",
          "data-track": chart.track("time-aggregation-max"),
        },
        {
          value: "average",
          label: "Mean or Average",
          description:
            "Calculate the longer term average, as if data were collected at screen resolution.",
          short: "AVG()",
          "data-track": chart.track("time-aggregation-average"),
        },
        {
          value: "sum",
          label: "Sum",
          description:
            "Provide the sum of the points that are aggregated over time. Use it when a sense of volume is needed over the aggregation period. It may not be sensible to use this function on all data types.",
          short: "SUM()",
          "data-track": chart.track("time-aggregation-sum"),
        },
        Array.isArray(restTiers) &&
          typeof firstTier?.points !== "undefined" && {
            justDesc: true,
            description: `The functions below lose accuracy when applied on tiered data, compared to high resolution data. Your current query is ${
              (firstTier.points * 100.0) / perTier.reduce((h, t) => h + t.points, 0)
            }% high resolution and ${
              (restTiers.reduce((h, t) => h + t.points, 0) * 100.0) /
              perTier.reduce((h, t) => h + t.points, 0).toFixed(2)
            }% tiered data of lower resolution.`,
          },
        {
          value: "percentile",
          label: "Percentile",
          description:
            "Provide the maximum value of a percentage of the aggregated points, having the smaller values. The default is p95, which provides the maximum value of the aggregated points after ignoring the top 5% of them.",
          short: "PERCENTILE()",
          "data-track": chart.track("time-aggregation-percentile95"),
        },
        {
          value: "trimmed-mean",
          label: "Trimmed Average or Trimmed Mean",
          description:
            "Like average, but first remove a percentage of the extreme high and low values.",
          short: "TRIMMEAN()",
          "data-track": chart.track("time-aggregation-trimmed-mean5"),
        },
        {
          value: "median",
          label: "Median",
          description:
            "The middle value of all points that would otherwise be smoothed out. This function works like average, but short extreme dives and spikes influence it significantly less than average.",
          short: "MEDIAN()",
          "data-track": chart.track("time-aggregation-median"),
        },
        {
          value: "trimmed-median",
          label: "Trimmed Median",
          description:
            "Like median, but first remove a percentage of the extreme high and low values.",
          short: "TRIMMEDIAN()",
          "data-track": chart.track("time-aggregation-trimmed-median5"),
        },
        {
          value: "stddev",
          label: "Standard deviation",
          description:
            "Reveal how far each point lies from the average. A high standard deviation means that values are generally far from the average, while a low standard deviation indicates that values are clustered close to the mean. The result is again in the original units of the data source metric.",
          short: "STDDEV()",
          "data-track": chart.track("time-aggregation-stddev"),
        },
        {
          value: "cv",
          label: "Coefficient of variation or Relative standard deviation",
          description:
            "The ratio of the standard deviation to the average. Its use is the same as standard deviation, but expressed as a percentage related to the average. The units change to %.",
          short: "CV()",
          "data-track": chart.track("time-aggregation-cv"),
        },
        {
          value: "incremental-sum",
          label: "Incremental Sum or Delta",
          description:
            "Provide the difference between the newest and the oldest values of the aggregated points. Each point will be positive if the trend grows and negative if the trend shrinks.",
          short: "DELTA()",
          "data-track": chart.track("time-aggregation-incremental-sum"),
        },

        {
          value: "ses",
          label: "Single exponential smoothing",
          description:
            "Use the aggregated points to produce a forecast of the next value, and reveal the forecasted value. Use it when there are indications that the trend is more predictable using the more recent points than the older ones.",
          short: "SES()",
          "data-track": chart.track("time-aggregation-ses"),
        },
        {
          value: "des",
          label: "Double exponential smoothing",
          description:
            "Like single exponential smoothing, but better suited when the aggregated points may have a strong trend.",
          short: "DES()",
          "data-track": chart.track("time-aggregation-des"),
        },
      ].filter(Boolean),
    [chart, firstTier?.points]
  )
}

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

const dropTitle = (
  <TextSmall padding={[0, 0, 2]}>
    When the screen resolution provides less points than the points available of the source
    time-series metrics, use the following aggregation function over time on each metric to reduce
    the number of points
  </TextSmall>
)

const TimeAggregation = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const groupingMethod = useAttributeValue("groupingMethod")
  const [method = "", alias = ""] = groupingMethod.match(/[\d.]+|\D+/g) || []

  const viewUpdateEvery = useAttributeValue("viewUpdateEvery")
  const perTier = useAttributeValue("perTier")

  const items = useMenuItems(chart, perTier)
  const aliasItems = useMenuAliasItems({ chart, method })

  const { short } = items.find(item => item.value === method) || items[0]
  const aliasItem = aliasItems.find(item => item.value === alias) || aliasItems[0]

  const handleAliasChange = value =>
    chart.updateTimeAggregationMethodAttribute({ alias: value, method })
  const handleMethodChange = value =>
    chart.updateTimeAggregationMethodAttribute({ alias: defaultAliases[value], method: value })

  return (
    <>
      {alias && (
        <Dropdown
          value={alias}
          onChange={handleAliasChange}
          items={aliasItems}
          data-track={chart.track("groupingMethodAlias")}
          {...rest}
          labelProps={{
            secondaryLabel: "each as",
            label: aliasItem.short,
            title: aliasTooltipProps.heading,
            tooltipProps: aliasTooltipProps,
            ...labelProps,
          }}
        />
      )}
      <Dropdown
        value={method}
        onChange={handleMethodChange}
        items={items}
        data-track={chart.track("groupingMethod")}
        dropTitle={dropTitle}
        {...rest}
        labelProps={{
          secondaryLabel: !alias && "each as",
          tertiaryLabel: `every ${viewUpdateEvery}s`,
          label: short,
          title: methodTooltipProps.heading,
          tooltipProps: methodTooltipProps,
          ...labelProps,
        }}
      />
    </>
  )
}

export default memo(TimeAggregation)
