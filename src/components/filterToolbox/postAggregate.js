import React, { memo, useMemo } from "react"
import { useAttributeValue, useChart, useIsMinimal } from "@/components/provider"
import AggrAvg from "@netdata/netdata-ui/dist/components/icon/assets/aggregation_avg.svg"
import AggrSum from "@netdata/netdata-ui/dist/components/icon/assets/aggregation_sum.svg"
import AggrMin from "@netdata/netdata-ui/dist/components/icon/assets/aggregation_min.svg"
import AggrMax from "@netdata/netdata-ui/dist/components/icon/assets/aggregation_max.svg"
import Icon from "@/components/icon"
import Dropdown from "./dropdownSingleSelect"

const useItems = chart =>
  useMemo(
    () => [
      {
        value: "avg",
        label: "Average",
        description: "For each aggregated point, calculate the average of the metrics.",
        short: "AVG()",
        icon: <Icon svg={AggrAvg} color="textLite" size="10px" />,
        "data-track": chart.track("avg"),
      },
      {
        value: "sum",
        label: "Sum",
        description: "For each aggregated point, calculate the sum of the metrics.",
        short: "SUM()",
        icon: <Icon svg={AggrSum} color="textLite" size="10px" />,
        "data-track": chart.track("sum"),
      },
      {
        value: "min",
        label: "Minimum",
        description: "For each aggregated point, present the minimum of the metrics.",
        short: "MIN()",
        icon: <Icon svg={AggrMin} color="textLite" size="10px" />,
        "data-track": chart.track("min"),
      },
      {
        value: "max",
        label: "Maximum",
        description: "For each aggregated point, present the maximum of the metrics.",
        short: "MAX()",
        icon: <Icon svg={AggrMax} color="textLite" size="10px" />,
        "data-track": chart.track("max"),
      },
    ],
    [chart]
  )

const tooltipProps = {
  heading: "Metrics post aggregation",
}

const PostAggregate = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("postAggregationMethod")

  const items = useItems(chart)
  const isMinimal = useIsMinimal()

  const { short, icon } = items.find(item => item.value === value) || items[0]

  return (
    <Dropdown
      value={value}
      onChange={chart.updatePostAggregationMethodAttribute}
      items={items}
      data-track={chart.track("post-aggregate")}
      {...rest}
      labelProps={{
        secondaryLabel: isMinimal ? "" : "the",
        label: isMinimal ? icon : short,
        title: tooltipProps.heading,
        tooltipProps,
        ...labelProps,
      }}
    />
  )
}

export default memo(PostAggregate)
