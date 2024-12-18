import React, { memo, useMemo } from "react"
import { Flex, Menu } from "@netdata/netdata-ui"
import dragHorizontalIcon from "@netdata/netdata-ui/dist/components/icon/assets/drag_horizontal.svg"
import dragVerticalIcon from "@netdata/netdata-ui/dist/components/icon/assets/drag_vertical.svg"
import chevronUpIcon from "@netdata/netdata-ui/dist/components/icon/assets/chevron_up_thin.svg"
import chevronDownIcon from "@netdata/netdata-ui/dist/components/icon/assets/chevron_down_thin.svg"
import { useChart, useAttribute, useAttributeValue } from "@/components/provider"
import Icon, { Button } from "@/components/icon"

const useItems = chart =>
  useMemo(
    () => [
      {
        value: "select",
        title: "Select and zoom",
        icon: <Icon svg={dragHorizontalIcon} size="16px" />,
        "data-track": chart.track("selectHorizontal"),
      },
      {
        value: "selectVertical",
        title: "Select vertical and zoom",
        icon: <Icon svg={dragVerticalIcon} size="16px" />,
        "data-track": chart.track("selectVertical"),
      },
    ],
    [chart]
  )

const Label = ({ value: selectedValue, onChange, onClick, open, item, ref, ...rest }) => {
  const { icon, value, title } = item

  return (
    <Flex ref={ref} alignItems="end" {...rest}>
      <Button
        icon={icon}
        title={title}
        active={selectedValue === value}
        onClick={() => onChange(value)}
        padding="2px"
        small
      />
      <Button
        icon={<Icon svg={open ? chevronUpIcon : chevronDownIcon} size="12px" />}
        onClick={onClick}
        padding="2px"
        stroked
        small
      />
    </Flex>
  )
}

const Dropdown = ({ onItemClick, items }) => {
  const [{ icon, value, title }] = items
  const id = useAttributeValue("id")

  return (
    <Flex
      background="dropdown"
      round={{ side: "bottom" }}
      border={{ side: "bottom", color: "borderSecondary" }}
      padding={[1, 0]}
      data-toolbox={id}
    >
      <Button title={title} icon={icon} onClick={() => onItemClick(value)} padding="2px" small />
    </Flex>
  )
}

const Select = () => {
  const chart = useChart()
  const [navigation, setNavigation] = useAttribute("navigation")

  const items = useItems(chart)

  const { selectedItem, remainingItems } = useMemo(
    () =>
      items.reduce(
        (h, item) => {
          if (item.value === navigation) return { ...h, selectedItem: item }
          return { ...h, remainingItems: [item] }
        },
        {
          selectedItem: items[0],
          remainingItems: [],
        }
      ),
    [navigation]
  )

  return (
    <Menu
      value={navigation}
      onChange={setNavigation}
      items={remainingItems}
      Dropdown={Dropdown}
      data-track="select"
    >
      <Label value={navigation} onChange={setNavigation} item={selectedItem} />
    </Menu>
  )
}

export default memo(Select)
