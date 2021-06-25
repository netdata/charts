import React, { useEffect, useState } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { ItemContainer } from "@netdata/netdata-ui/lib/components/drops/menu/dropdownItem"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import RadioButton from "@netdata/netdata-ui/lib//components/radio-button"
import sortDesc from "@netdata/netdata-ui/lib/components/icon/assets/sort_desc.svg"
import Icon, { Button } from "@/components/icon"
import styled from "styled-components"

const Input = styled.input.attrs({ type: "radio" })`
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
`

const Item = ({ item: { value, label }, value: selectedValue, onItemClick }) => {
  return (
    <ItemContainer gap={2} onClick={() => onItemClick(value)}>
      <Input name="dimensionsSort" value={value} checked={value === selectedValue} />
      <Text>{label}</Text>
    </ItemContainer>
  )
}

const renderItem = props => {
  const key = props.item.value || props.item.label
  return <Item key={key} {...props} />
}

const sortings = [
  { value: "default", label: "Default" },
  { value: "nameAsc", label: "Sort by name A→Z" },
  { value: "nameDesc", label: "Sort by name Z→A" },
  { value: "valueAsc", label: "Sort by value Max→Min " },
  { value: "valueDesc", label: "Sort by value Min→Max " },
]

const DimensionFilter = ({ chart }) => {
  const [value, setValue] = useState(chart.getAttribute("dimensionsSort"))

  const onChange = value => chart.updateAttribute("dimensionsSort", value)

  useEffect(() => chart.onAttributeChange("dimensionsSort", setValue), [])

  return (
    <Flex padding={[3, 5]}>
      <Menu
        value={value}
        items={sortings}
        dropProps={{ align: { bottom: "top", left: "left" } }}
        renderItem={renderItem}
        onChange={onChange}
      >
        <Button icon={<Icon svg={sortDesc} />} />
      </Menu>
    </Flex>
  )
}

export default DimensionFilter