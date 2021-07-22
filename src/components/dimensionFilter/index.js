import React, { useEffect, useState } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { ItemContainer } from "@netdata/netdata-ui/lib/components/drops/menu/dropdownItem"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import sortDesc from "@netdata/netdata-ui/lib/components/icon/assets/sort_desc.svg"
import Icon, { Button } from "@/components/icon"
import { useChart } from "@/components/provider"

const Input = styled.input.attrs({ type: "radio" })`
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
`

const Item = ({ item: { value, label }, value: selectedValue, onItemClick }) => {
  return (
    <ItemContainer
      gap={2}
      onClick={() => onItemClick(value)}
      data-testid={`chartDimensionFilter-${value}`}
    >
      <Input
        name="dimensionsSort"
        value={value}
        defaultChecked={value === selectedValue}
        data-testid="chartDimensionFilter-input"
      />
      <Text data-testid="chartDimensionFilter-label">{label}</Text>
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

const DimensionFilter = props => {
  const chart = useChart()
  const [value, setValue] = useState(chart.getAttribute("dimensionsSort"))

  const onChange = value => chart.updateAttribute("dimensionsSort", value)

  useEffect(() => chart.onAttributeChange("dimensionsSort", setValue), [chart])

  return (
    <Flex padding={[2, 4]} data-testid="chartDimensionFilter" {...props}>
      <Menu
        value={value}
        items={sortings}
        dropProps={{ align: { bottom: "top", left: "left" } }}
        renderItem={renderItem}
        onChange={onChange}
      >
        <Button icon={<Icon svg={sortDesc} />} data-testid="chartDimensionFilter-toggle" />
      </Menu>
    </Flex>
  )
}

export default DimensionFilter
