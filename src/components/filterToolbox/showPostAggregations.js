import React from "react"
import { useChart, useAttributeValue } from "@/components/provider/selectors"
import Label from "./label"

const tooltipProps = {
  heading: "Show/hide post aggregations",
}

const ShowPostAggregations = ({ labelProps }) => {
  const chart = useChart()
  const showPostAggregations = useAttributeValue("showPostAggregations")

  return (
    <Label
      {...labelProps}
      onClick={() => chart.updateAttribute("showPostAggregations", !showPostAggregations)}
      data-track={chart.track("showPostAggregations")}
      tooltipProps={tooltipProps}
      title={tooltipProps.heading}
    />
  )
}

export default ShowPostAggregations
