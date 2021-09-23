import React, { useEffect, useState } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import RadioButton from "@netdata/netdata-ui/lib/components/radio-button"
import dot from "@netdata/netdata-ui/lib/components/icon/assets/dot.svg"
import { ItemContainer } from "@netdata/netdata-ui/lib/components/drops/menu/dropdownItem"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import sortAscending from "@netdata/netdata-ui/lib/components/icon/assets/sort_ascending.svg"
import sortDescending from "@netdata/netdata-ui/lib/components/icon/assets/sort_descending.svg"
import Icon, { Button } from "@/components/icon"
import { useChart } from "@/components/provider"

const RadioButtonIcon = props => <Icon svg={dot} {...props} />

const iconProps = { as: RadioButtonIcon }

const Item = ({ item: { value, label }, value: selectedValue, onItemClick }) => (
  <ItemContainer gap={2} data-testid={`chartDimensionFilter-${value}`}>
    <RadioButton
      label={<Text data-testid="chartDimensionFilter-label">{label}</Text>}
      checked={value === selectedValue}
      onChange={e => onItemClick(e.target.value)}
      value={value}
      data-testid="chartDimensionFilter-input"
      name="dimensionsSort"
      iconProps={iconProps}
    />
  </ItemContainer>
)

const renderItem = props => {
  const key = props.item.value || props.item.label
  return <Item key={key} {...props} />
}

const iconBySort = {
  default: sortDescending,
  nameAsc: sortAscending,
  nameDesc: sortDescending,
  valueAsc: sortAscending,
  valueDesc: sortDescending,
}

const sortings = [
  { value: "default", label: "Default" },
  { value: "nameAsc", label: "Sort by name A→Z" },
  { value: "nameDesc", label: "Sort by name Z→A" },
  { value: "valueAsc", label: "Sort by value Min→Max " },
  { value: "valueDesc", label: "Sort by value Max→Min " },
]

const DimensionFilter = props => {
  const chart = useChart()
  const [value, setValue] = useState(chart.getAttribute("dimensionsSort"))

  const onChange = value => chart.updateAttribute("dimensionsSort", value)

  useEffect(() => chart.onAttributeChange("dimensionsSort", setValue), [chart])

  return (
    <Flex padding={[3, 4]} data-testid="chartDimensionFilter" {...props}>
      <Menu
        value={value}
        items={sortings}
        dropProps={{ align: { bottom: "top", left: "left" } }}
        renderItem={renderItem}
        onChange={onChange}
      >
        <Button icon={<Icon svg={iconBySort[value]} />} data-testid="chartDimensionFilter-toggle" />
      </Menu>
    </Flex>
  )
}

export default DimensionFilter
