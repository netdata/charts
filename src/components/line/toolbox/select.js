import React, { forwardRef, memo, useMemo } from "react"
import selectIcon from "@netdata/netdata-ui/lib/components/icon/assets/select.svg"
import differenceIcon from "@netdata/netdata-ui/lib/components/icon/assets/difference.svg"
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
        icon: <Icon svg={selectIcon} />,
        "data-track": chart.track("selectHorizontal"),
      },
      {
        value: "selectVertical",
        title: "Select vertical and zoom",
        icon: <Icon svg={differenceIcon} />,
        "data-track": chart.track("selectVertical"),
      },
    ],
    [chart]
  )

const Label = forwardRef(
  ({ value: selectedValue, onChange, onClick, open, item, ...rest }, ref) => {
    const { icon, value, title } = item

    return (
      <Flex ref={ref} {...rest}>
        <Button
          icon={icon}
          title={title}
          active={selectedValue === value}
          onClick={() => onChange(value)}
        />
        <Button
          title={open ? "Close menu" : "Open menu"}
          icon={<Icon svg={open ? chevronUpIcon : chevronDownIcon} width="16px" />}
          onClick={onClick}
          hoverIndicator={false}
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
      <Button title={title} icon={icon} onClick={() => onItemClick(value)} />
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
