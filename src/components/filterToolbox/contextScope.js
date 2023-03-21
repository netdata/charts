import React, { memo } from "react"
import { useAttributeValue, useChart } from "@/components/provider"
import Dropdown from "./dropdownSingleSelect"

const tooltipProps = {
  heading: "Context",
  body: "View or select the context applied on this chart.",
}

const ContextScope = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("contextScope")
  const items = useAttributeValue("contextItems")

  if (!items.length) return null

  const { label } = items.find(item => item.value === value[0]) || items[0]

  return (
    <Dropdown
      value={value}
      onChange={chart.updateContextScopeAttribute}
      items={items}
      data-track={chart.track("contextScope")}
      {...rest}
      labelProps={{
        secondaryLabel: "On",
        label,
        title: tooltipProps.heading,
        tooltipProps,
        ...labelProps,
      }}
    />
  )
}

export default memo(ContextScope)
