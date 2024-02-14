import React, { useEffect, useState, useMemo } from "react"
import { Flex, Menu, MenuItemContainer, RadioButton, TextSmall } from "@netdata/netdata-ui"
import dot from "@netdata/netdata-ui/dist/components/icon/assets/dot.svg"
import sortAscending from "@netdata/netdata-ui/dist/components/icon/assets/sort_ascending.svg"
import sortDescending from "@netdata/netdata-ui/dist/components/icon/assets/sort_descending.svg"
import Icon, { Button } from "@/components/icon"
import { useChart } from "@/components/provider"

const RadioButtonIcon = props => <Icon svg={dot} {...props} />

const iconProps = { as: RadioButtonIcon, size: "16px" }

const Item = ({ item: { value, label }, value: selectedValue, onItemClick }) => (
  <MenuItemContainer data-testid={`chartDimensionFilter-${value}`}>
    <RadioButton
      label={<TextSmall data-testid="chartDimensionFilter-label">{label}</TextSmall>}
      checked={value === selectedValue}
      onChange={e => onItemClick(e.target.value)}
      value={value}
      data-testid="chartDimensionFilter-input"
      name="dimensionsSort"
      iconProps={iconProps}
    />
  </MenuItemContainer>
)

const iconBySort = {
  default: sortDescending,
  nameAsc: sortAscending,
  nameDesc: sortDescending,
  valueAsc: sortAscending,
  valueDesc: sortDescending,
  anomalyAsc: sortAscending,
  anomalyDesc: sortDescending,
}

const useSortings = chart =>
  useMemo(
    () => [
      { value: "default", label: "Default", "data-track": chart.track("default") },
      { value: "nameAsc", label: "Sort by name A→Z", "data-track": chart.track("nameAsc") },
      { value: "nameDesc", label: "Sort by name Z→A", "data-track": chart.track("nameDesc") },
      { value: "valueAsc", label: "Sort by value Min→Max", "data-track": chart.track("valueAsc") },
      {
        value: "valueDesc",
        label: "Sort by value Max→Min",
        "data-track": chart.track("valueDesc"),
      },
      {
        value: "anomalyAsc",
        label: "Sort by anomaly Min→Max",
        "data-track": chart.track("anomalyAsc"),
      },
      {
        value: "anomalyDesc",
        label: "Sort by anomaly Max→Min",
        "data-track": chart.track("anomalyDesc"),
      },
    ],
    [chart]
  )

const DimensionSort = props => {
  const chart = useChart()
  const [value, setValue] = useState(chart.getAttribute("dimensionsSort"))

  const onChange = value => chart.updateAttribute("dimensionsSort", value)

  useEffect(() => chart.onAttributeChange("dimensionsSort", setValue), [chart])

  const sortings = useSortings(chart)

  return (
    <Flex padding={[0, 4, 3]} data-testid="chartDimensionSort" {...props}>
      <Menu
        value={value}
        items={sortings}
        dropProps={{ align: { bottom: "top", left: "left" }, "data-toolbox": chart.getId() }}
        dropdownProps={{ width: "200px", padding: [2, 0] }}
        Item={Item}
        onChange={onChange}
      >
        <Button
          icon={<Icon svg={iconBySort[value]} size="16px" />}
          data-testid="chartDimensionSort-toggle"
          title="Sort dimensions by name or value"
          small
        />
      </Menu>
    </Flex>
  )
}

export default DimensionSort
