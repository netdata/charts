import React from "react"
import { ItemContainer } from "@netdata/netdata-ui/lib/components/drops/menu/dropdownItem"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import checkmark from "@netdata/netdata-ui/lib/components/icon/assets/checkmark_s.svg"
import { Checkbox } from "@netdata/netdata-ui/lib/components/checkbox"
import { useChart, useAttributeValue, useMetadata } from "@/components/provider"
import Icon from "@/components/icon"
import Multiselect from "./multiselect"

const CheckboxIcon = props => {
  return <Icon svg={checkmark} {...props} size="16px" />
}

const tooltipProps = {
  heading: "Dimensions",
  body: "Select one, multiple or all dimensions. A dimension is any value, either raw data or the result of a calculation that Netdata visualizes on a chart.",
}

const iconProps = { as: CheckboxIcon }

const Item = ({ item: { label, value }, value: selectedValues, onItemClick }) => {
  const isAll = value === "all"
  const checked = selectedValues.includes(value) || (isAll && selectedValues.length === 0)

  return (
    <ItemContainer gap={2}>
      <Checkbox
        iconProps={iconProps}
        checked={checked}
        onChange={() => onItemClick(value)}
        label={<TextSmall>{isAll ? "All dimensions" : label || value}</TextSmall>}
      />
    </ItemContainer>
  )
}

const renderItem = props => {
  const key = props.item.value || props.item.label
  return <Item key={key} {...props} />
}

const Dimensions = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("dimensions")
  const { dimensions } = useMetadata()

  return (
    <Multiselect
      attrName="dimensions"
      allName="All dimensions"
      data-track={chart.track("dimensions")}
      options={dimensions}
      renderItem={renderItem}
      tooltipProps={tooltipProps}
      value={value}
      {...rest}
    />
  )
}

export default Dimensions
