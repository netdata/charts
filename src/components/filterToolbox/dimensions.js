import React, { useMemo, memo } from "react"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { ItemContainer } from "@netdata/netdata-ui/lib/components/drops/menu/dropdownItem"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import checkmark from "@netdata/netdata-ui/lib/components/icon/assets/checkmark_s.svg"
import { Checkbox } from "@netdata/netdata-ui/lib/components/checkbox"
import { useChart, useAttributeValue } from "@/components/provider"
import Icon from "@/components/icon"
import Label from "./label"

const getItems = chart => {
  const { dimensions } = chart.getMetadata()
  return ["all", ...Object.keys(dimensions)].map(value => ({ value }))
}

const getLabel = value => {
  if (value.length === 0) return `All dimensions`
  if (value.length === 1) return value[0]
  return `${value.length} dimensions`
}

const CheckboxIcon = props => {
  return <Icon svg={checkmark} {...props} />
}

const iconProps = { as: CheckboxIcon }

const Item = ({ item: { value }, value: selectedValues, onItemClick }) => {
  const isAll = value === "all"
  const checked = selectedValues.includes(value) || (isAll && selectedValues.length === 0)

  return (
    <ItemContainer gap={2}>
      <Checkbox
        iconProps={iconProps}
        checked={checked}
        onChange={() => onItemClick(value)}
        label={<Text>{isAll ? "All dimensions" : value}</Text>}
      />
    </ItemContainer>
  )
}

const renderItem = props => {
  const key = props.item.value || props.item.label
  return <Item key={key} {...props} />
}

const Dimensions = () => {
  const chart = useChart()
  const value = useAttributeValue("dimensions")

  const options = useMemo(() => getItems(chart), [chart])

  const label = getLabel(value)

  return (
    <Menu
      value={value}
      onChange={chart.updateDimensionsAttribute}
      items={options}
      renderItem={renderItem}
      closeOnClick={false}
    >
      <Label secondaryLabel="of" label={label} />
    </Menu>
  )
}

export default memo(Dimensions)
