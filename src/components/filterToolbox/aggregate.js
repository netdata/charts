import React, { memo, useMemo } from "react"
import { TextMicro } from "@netdata/netdata-ui"
import { useAttributeValue, useChart, useIsMinimal } from "@/components/provider"
import AggrAvg from "@netdata/netdata-ui/dist/components/icon/assets/aggregation_avg.svg"
import AggrSum from "@netdata/netdata-ui/dist/components/icon/assets/aggregation_sum.svg"
import AggrMin from "@netdata/netdata-ui/dist/components/icon/assets/aggregation_min.svg"
import AggrMax from "@netdata/netdata-ui/dist/components/icon/assets/aggregation_max.svg"
import Dropdown from "./dropdownSingleSelect"
import Icon from "@/components/icon"

const useItems = chart =>
  useMemo(
    () => [
      {
        value: "avg",
        label: "Average",
        description:
          "For each point presented, calculate the average of the metrics contributing to it.",
        short: "AVG()",
        icon: <Icon svg={AggrAvg} color="textLite" size="10px" />,
        "data-track": chart.track("avg"),
      },
      {
        value: "sum",
        label: "Sum",
        description:
          "For each point presented, calculate the sum of the metrics contributing to it.",
        short: "SUM()",
        icon: <Icon svg={AggrSum} color="textLite" size="10px" />,
        "data-track": chart.track("sum"),
      },
      {
        value: "min",
        label: "Minimum",
        description:
          "For each point presented, present the minimum of the metrics contributing to it.",
        short: "MIN()",
        icon: <Icon svg={AggrMin} color="textLite" size="10px" />,
        "data-track": chart.track("min"),
      },
      {
        value: "max",
        label: "Maximum",
        description:
          "For each point presented, present the maximum of the metrics contributing to it.",
        short: "MAX()",
        icon: <Icon svg={AggrMax} color="textLite" size="10px" />,
        "data-track": chart.track("max"),
      },
    ],
    [chart]
  )

const dropTitle = (
  <TextMicro padding={[0, 0, 2]} color="textLite">
    When aggregating multiple source time-series metrics to one visible dimension on the chart, use
    the following aggregation function
  </TextMicro>
)

const tooltipProps = {
  heading: "Metrics aggregation",
  body: "View or select the aggregation function applied when multiple source time-series metrics need to be grouped together to be presented as dimensions on this chart.",
}

const Aggregate = ({ labelProps, defaultMinimal, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("aggregationMethod")

  const items = useItems(chart)
  const isMinimal = useIsMinimal()

  const { short, icon } = items.find(item => item.value === value) || items[0]

  return (
    <Dropdown
      value={value}
      onChange={chart.updateAggregationMethodAttribute}
      items={items}
      data-track={chart.track("aggregate")}
      dropTitle={dropTitle}
      {...rest}
      labelProps={{
        chevron: !isMinimal && !defaultMinimal,
        secondaryLabel: isMinimal || defaultMinimal ? "" : "the",
        label: isMinimal || defaultMinimal ? icon : short,
        title: tooltipProps.heading,
        tooltipProps,
        ...labelProps,
      }}
    />
  )
}

export default memo(Aggregate)
