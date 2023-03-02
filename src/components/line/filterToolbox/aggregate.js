import React, { memo, useMemo } from "react"
import styled from "styled-components"
import { Menu, Text, TextSmall, TextMicro, Flex, getColor } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"
import Label from "./label"

const useItems = chart =>
  useMemo(
    () => [
      {
        value: "avg",
        label: "Average",
        description:
          "For each point presented, calculate the average of the metrics contributing to it.",
        short: "AVG()",
        "data-track": chart.track("avg"),
      },
      {
        value: "sum",
        label: "Sum",
        description:
          "For each point presented, calculate the sum of the metrics contributing to it.",
        short: "SUM()",
        "data-track": chart.track("sum"),
      },
      {
        value: "min",
        label: "Minimum",
        description:
          "For each point presented, present the minimum of the metrics contributing to it.",
        short: "MIN()",
        "data-track": chart.track("min"),
      },
      {
        value: "max",
        label: "Maximum",
        description:
          "For each point presented, present the maximum of the metrics contributing to it.",
        short: "MAX()",
        "data-track": chart.track("max"),
      },
    ],
    [chart]
  )
const dropTitle = (
  <TextSmall>
    When aggregating multiple multiple source time-series metrics to one visible dimension on the
    chart, use the following aggregation function
  </TextSmall>
)
const tooltipProps = {
  heading: "Metrics aggregation",
  body: "View or select the aggregation function applied when multiple source time-series metrics need to be grouped together to be presented as dimensions on this chart.",
}
export const ItemContainer = styled(Flex).attrs(props => ({
  as: "li",
  role: "option",
  padding: [1, 2],
  gap: 1,
  justifyContent: "between",
  ...props,
}))`
  cursor: ${({ disabled }) => (disabled ? "default" : "pointer")};
  opacity: ${({ disabled, stale }) => (stale || disabled ? 0.7 : 1)};
  align-items: ${({ alignItems }) => alignItems || "center"};
  ${({ multi, selected, theme }) =>
    !multi &&
    selected &&
    `
    background-color: ${getBackground({ theme })};
  `}
  ${({ multi, selected, theme }) =>
    !multi &&
    !selected &&
    `
    &:hover {
      background-color: ${getColor("borderSecondary")({ theme })};
    }
  `}
`
const DefaultItem = ({ item, onItemClick, itemProps, ...rest }) => {
  const {
    value,
    disabled,
    onClick,
    label,
    description,
    selected,
    indeterminate,
    textColor,
    iconName,
    count,
    level = 0,
    ...restItem
  } = item

  const onSelect = event => {
    if (onClick) onClick(event)
    onItemClick({ value, label, checked: !selected, item })
  }

  return (
    <ItemContainer {...itemProps}>
      <Flex gap={2} alignItems="center" padding={[0, 0, 0, level * 4]} width="100%">
        <Flex column padding={[0, 1]} alignItems="start" onClick={onSelect}>
          <Text>{label}</Text>
          <TextSmall color="textLite">{description}</TextSmall>
        </Flex>
      </Flex>
    </ItemContainer>
  )
}

const Aggregate = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("aggregationMethod")

  const items = useItems(chart)

  const { short } = items.find(item => item.value === value) || items[0]

  return (
    <Menu
      value={value}
      onChange={chart.updateAggregationMethodAttribute}
      items={items}
      Item={DefaultItem}
      data-track={chart.track("aggregate")}
      dropProps={{
        align: { top: "bottom", left: "left" },
        "data-toolbox": true,
        width: "460px",
      }}
      dropdownProps={{ padding: [0, 0, 2, 0] }}
      dropTitle={dropTitle}
      {...rest}
    >
      <Label
        secondaryLabel="the"
        label={short}
        title={tooltipProps.heading}
        tooltipProps={tooltipProps}
        {...labelProps}
      />
    </Menu>
  )
}

export default memo(Aggregate)
