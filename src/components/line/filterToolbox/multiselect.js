// Deprecate
import React, { useCallback, useMemo } from "react"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { ItemContainer } from "@netdata/netdata-ui/lib/components/drops/menu/dropdownItem"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import checkmark from "@netdata/netdata-ui/lib/components/icon/assets/checkmark_s.svg"
import { Checkbox } from "@netdata/netdata-ui/lib/components/checkbox"

import Icon from "@/components/icon"
import Label from "./label"
import Tooltip from "@/components/tooltip"

const ALL = "all"
const allItem = { value: ALL }
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
  item: { label, value, labelWithEllipsis },
  itemProps: { allName, renderLink },
  value: selectedValues,
  onItemClick,
  ...rest
}) => {
  const isAll = value === ALL
  const checked = selectedValues.includes(value) || (isAll && selectedValues.length === 0)
  const textContent = isAll ? allName : labelWithEllipsis || label || value

  return (
    <ItemContainer gap={2} justifyContent="between" {...rest}>
      <Checkbox
        iconProps={iconProps}
        checked={checked}
        onChange={() => onItemClick(value)}
        label={
          labelWithEllipsis ? (
            <TextSmall>
              <Tooltip content={label}>{textContent}</Tooltip>
            </TextSmall>
          ) : (
            <TextSmall>{textContent}</TextSmall>
          )
        }
      />
      {!isAll && renderLink && renderLink({ value })}
    </ItemContainer>
  )
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
      if (item === ALL) {
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
      allName={items.length === 1 ? items[0].label : allName}
      onChange={handleChange}
      items={items}
      hasSearch={items.length > 4}
      Item={Item}
      closeOnClick={false}
      dropProps={{
        align: { top: "bottom", left: "left" },
        "data-toolbox": true,
        keepHorizontal: true,
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
