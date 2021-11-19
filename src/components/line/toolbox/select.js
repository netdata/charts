import React, { forwardRef, memo, useMemo } from "react"
import dragHorizontalIcon from "@netdata/netdata-ui/lib/components/icon/assets/drag_horizontal.svg"
import dragVerticalIcon from "@netdata/netdata-ui/lib/components/icon/assets/drag_vertical.svg"
import chevronUpIcon from "@netdata/netdata-ui/lib/components/icon/assets/chevron_up_thin.svg"
import chevronDownIcon from "@netdata/netdata-ui/lib/components/icon/assets/chevron_down_thin.svg"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { useChart, useAttribute } from "@/components/provider"
import Icon, { Button } from "@/components/icon"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"

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

const Label = forwardRef(
  ({ value: selectedValue, onChange, onClick, open, item, ...rest }, ref) => {
    const { icon, value, title } = item

    return (
      <Flex ref={ref} alignItems="end" {...rest}>
        <Button
          icon={icon}
          title={title}
          active={selectedValue === value}
          onClick={() => onChange(value)}
          padding="2px"
        />
        <Button
          icon={<Icon svg={open ? chevronUpIcon : chevronDownIcon} size="12px" />}
          onClick={onClick}
          padding="2px"
          stroked
        />
      </Flex>
    )
  }
)

const renderDropdown = ({ onItemClick, items }) => {
  const [{ icon, value, title }] = items

  return (
    <Flex
      background="dropdown"
      round={{ side: "bottom" }}
      border={{ side: "bottom", color: "borderSecondary" }}
      padding={[1, 0]}
      data-toolbox
    >
      <Button title={title} icon={icon} onClick={() => onItemClick(value)} padding="2px" />
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
      renderDropdown={renderDropdown}
      data-track="select"
    >
      <Label value={navigation} onChange={setNavigation} item={selectedItem} />
    </Menu>
  )
}

export default memo(Select)
