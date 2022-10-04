import React, { useMemo } from "react"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { useChart } from "@/components/provider"
import Label from "./label"

const getItems = dimensions =>
  dimensions
    ? ["all", ...Object.keys(dimensions)].map(value => ({
        label: dimensions[value]?.name || value,
        value,
      }))
    : [{ value: "all" }]

const getLabel = ({ allName, attrName, items, value }) => {
  if (value.length === 0) return allName
  if (value.length === 1) {
    const item = items.find(({ value: itemValue }) => value[0] === itemValue)
    return item?.label || value[0]
  }
  return `${value.length} ${attrName}`
}

const Multiselect = ({
  allName,
  attrName,
  dataTrack,
  labelProps,
  options,
  renderItem,
  tooltipProps,
  value,
  ...rest
}) => {
  const chart = useChart()
  const items = useMemo(() => getItems(options), [value, options])
  const label = getLabel({ allName, attrName, items, value })

  return (
    <Menu
      allName={allName}
      onChange={chart.updateDimensionsAttribute}
      items={items}
      renderItem={renderItem}
      closeOnClick={false}
      dropProps={{
        height: { max: "460px" },
        overflow: "auto",
        align: { top: "bottom", left: "left" },
        "data-toolbox": true,
      }}
      value={value}
      {...rest}
    >
      <Label
        secondaryLabel="select"
        label={label}
        title={tooltipProps.heading}
        tooltipProps={tooltipProps}
        {...labelProps}
      />
    </Menu>
  )
}

export default Multiselect
