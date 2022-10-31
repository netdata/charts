import React, { useCallback, useMemo } from "react"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { ItemContainer } from "@netdata/netdata-ui/lib/components/drops/menu/dropdownItem"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import checkmark from "@netdata/netdata-ui/lib/components/icon/assets/checkmark_s.svg"
import { Checkbox } from "@netdata/netdata-ui/lib/components/checkbox"

import Icon from "@/components/icon"
import Label from "./label"

const allItem = { value: "all" }
const getItems = options => [allItem, ...options]

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
  itemProps: { allName, renderLink },
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
      {!isAll && renderLink && renderLink({ value })}
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
  renderLink,
  secondaryLabel,
  tooltipProps,
  value,
  ...rest
}) => {
  const items = useMemo(() => getItems(options), [options])
  const label = getLabel({ allName, attrName, items, value })
  const handleChange = useCallback(
    item => {
      if (item === "all") {
        onChange([])
        return
      }
      const nextValue = value.includes(item) ? value.filter(v => v !== item) : [...value, item]

      if (!nextValue.length || nextValue.length === options.length) {
        onChange([])
        return
      }

      onChange(nextValue)
    },
    [options, value]
  )

  return (
    <Menu
      allName={allName}
      onChange={handleChange}
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
      itemProps={{ allName, renderLink }}
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
