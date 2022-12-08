import React, { useEffect, useState, useMemo } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import RadioButton from "@netdata/netdata-ui/lib/components/radio-button"
import dot from "@netdata/netdata-ui/lib/components/icon/assets/dot.svg"
import { ItemContainer } from "@netdata/netdata-ui/lib/components/drops/menu/dropdownItem"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import sortAscending from "@netdata/netdata-ui/lib/components/icon/assets/sort_ascending.svg"
import sortDescending from "@netdata/netdata-ui/lib/components/icon/assets/sort_descending.svg"
import Icon, { Button } from "@/components/icon"
import { useChart } from "@/components/provider"

const RadioButtonIcon = props => <Icon svg={dot} {...props} />

const iconProps = { as: RadioButtonIcon, size: "16px" }

const Item = ({ item: { value, label }, value: selectedValue, onItemClick }) => (
  <ItemContainer data-testid={`chartDimensionFilter-${value}`}>
    <RadioButton
      label={<TextSmall data-testid="chartDimensionFilter-label">{label}</TextSmall>}
      checked={value === selectedValue}
      onChange={e => onItemClick(e.target.value)}
      value={value}
      data-testid="chartDimensionFilter-input"
      name="dimensionsSort"
      iconProps={iconProps}
    />
  </ItemContainer>
)

const iconBySort = {
  default: sortDescending,
  nameAsc: sortAscending,
  nameDesc: sortDescending,
  valueAsc: sortAscending,
  valueDesc: sortDescending,
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
    ],
    [chart]
  )

const DimensionFilter = props => {
  const chart = useChart()
  const [value, setValue] = useState(chart.getAttribute("dimensionsSort"))

  const onChange = value => chart.updateAttribute("dimensionsSort", value)

  useEffect(() => chart.onAttributeChange("dimensionsSort", setValue), [chart])

  const sortings = useSortings(chart)

  return (
    <Flex padding={[0, 4, 3]} data-testid="chartDimensionFilter" {...props}>
      <Menu
        value={value}
        items={sortings}
        dropProps={{ align: { bottom: "top", left: "left" }, "data-toolbox": true }}
        Item={Item}
        onChange={onChange}
      >
        <Button
          icon={<Icon svg={iconBySort[value]} size="16px" />}
          data-testid="chartDimensionFilter-toggle"
          title="Sort dimensions by name or value"
          small
        />
      </Menu>
    </Flex>
  )
}

export default DimensionFilter
