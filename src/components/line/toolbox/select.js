import React, { forwardRef, memo, useMemo } from "react"
import selectIcon from "@netdata/netdata-ui/lib/components/icon/assets/select.svg"
import differenceIcon from "@netdata/netdata-ui/lib/components/icon/assets/difference.svg"
import chevronUpIcon from "@netdata/netdata-ui/lib/components/icon/assets/chevron_up_thin.svg"
import chevronDownIcon from "@netdata/netdata-ui/lib/components/icon/assets/chevron_down_thin.svg"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { useAttribute } from "@/components/provider"
import Icon, { Button } from "@/components/icon"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"

const items = [
  { value: "select", title: "Select and zoom", icon: <Icon svg={selectIcon} /> },
  {
    value: "selectVertical",
    title: "Select vertical and zoom",
    icon: <Icon svg={differenceIcon} />,
  },
]

const onlyLastItem = [items[1]]

const Label = forwardRef(({ value: selectedValue, onChange, onClick, open, ...rest }, ref) => {
  const item = items.find(item => item.value === selectedValue)
  const { icon, value, title } = item || items[0]

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
      />
    </Flex>
  )
})

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
  const [navigation, setNavigation] = useAttribute("navigation")

  const remainingItems = useMemo(() => {
    const remaining = items.filter(item => item.value !== navigation)
    return remaining.length === 2 ? onlyLastItem : remaining
  }, [navigation])

  return (
    <Menu
      value={navigation}
      onChange={setNavigation}
      items={remainingItems}
      renderDropdown={renderDropdown}
    >
      <Label value={navigation} onChange={setNavigation} />
    </Menu>
  )
}

export default memo(Select)
