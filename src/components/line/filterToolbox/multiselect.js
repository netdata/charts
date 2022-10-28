import React, { useMemo } from "react"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { ItemContainer } from "@netdata/netdata-ui/lib/components/drops/menu/dropdownItem"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import checkmark from "@netdata/netdata-ui/lib/components/icon/assets/checkmark_s.svg"
import { Checkbox } from "@netdata/netdata-ui/lib/components/checkbox"

import Icon from "@/components/icon"
import Label from "./label"

const getItems = options =>
  options
    ? ["all", ...Object.keys(options)].map(value => ({
        label: options[value]?.name || value,
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

const CheckboxIcon = props => {
  return <Icon svg={checkmark} {...props} size="16px" />
}

const iconProps = { as: CheckboxIcon }

const Item = ({
  item: { label, value },
  itemProps: { allName },
  value: selectedValues,
  onItemClick,
}) => {
  const isAll = value === "all"
  const checked = selectedValues.includes(value) || (isAll && selectedValues.length === 0)

  return (
    <ItemContainer gap={2}>
      <Checkbox
        iconProps={iconProps}
        checked={checked}
        onChange={() => onItemClick(value)}
        label={<TextSmall>{isAll ? allName : label || value}</TextSmall>}
      />
    </ItemContainer>
  )
}

const renderItem = props => {
  const { label, value } = props.item
  // value can be object
  const key = ["number", "string"].includes(typeof value) ? value : label
  return <Item key={key} {...props} />
}

const Multiselect = ({
  allName,
  attrName,
  labelProps,
  onChange,
  options,
  secondaryLabel,
  tooltipProps,
  value,
  ...rest
}) => {
  const items = useMemo(() => getItems(options), [value, options])
  const label = getLabel({ allName, attrName, items, value })

  return (
    <Menu
      allName={allName}
      onChange={onChange}
      items={items}
      renderItem={renderItem}
      closeOnClick={false}
      dropProps={{
        align: { top: "bottom", left: "left" },
        "data-toolbox": true,
      }}
      dropdownProps={{
        height: { max: "60vh" },
        overflow: "auto",
      }}
      itemProps={{ allName }}
      value={value}
      {...rest}
    >
      <Label
        secondaryLabel={secondaryLabel}
        label={label}
        title={tooltipProps.heading}
        tooltipProps={tooltipProps}
        {...labelProps}
      />
    </Menu>
  )
}

export default Multiselect
