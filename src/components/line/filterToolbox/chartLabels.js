import React, { useCallback, useEffect, useMemo, useState } from "react"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import Dropdown from "@netdata/netdata-ui/lib/components/drops/menu/dropdown"
import { ItemContainer } from "@netdata/netdata-ui/lib/components/drops/menu/dropdownItem"
import chevronDownIcon from "@netdata/netdata-ui/lib/components/icon/assets/chevron_down.svg"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useChart, useAttributeValue, useMetadata } from "@/components/provider"
import { Collapsible } from "@netdata/netdata-ui"
import Icon from "@/components/icon"
import ChartLabelValues from "./chartLabelValues"
import Label from "./label"
import Reset from "./reset"

export const checkIfValueIsSelected = ({ label, value, selectedLabels }) => {
  const labelValues = selectedLabels[label]?.split?.("|") ?? []
  return !!labelValues.includes?.(value)
}

const Item = ({ item, value: selectedLabels, onItemClick }) => {
  const { label, values } = item
  const sortedValues = useMemo(
    () => (Array.isArray(values) ? [...values].sort((a, b) => a.localeCompare(b)) : values),
    [values]
  )
  const isOpenedByDefault = !!selectedLabels[label]
  const [isOpen, setIsOpen] = useState(isOpenedByDefault)

  return (
    <Flex column>
      <ItemContainer alignItems="start" justifyContent="between" gap={2} cursor="initial">
        <TextSmall>{label}</TextSmall>
        <Icon
          svg={chevronDownIcon}
          onClick={() => setIsOpen(!isOpen)}
          rotate={isOpen ? 2 : 0}
          size="20px"
          color="border"
          cursor="pointer"
        />
      </ItemContainer>
      <Collapsible open={isOpen}>
        <Flex margin={[0, 0, 0, 6]} column overflow="auto" height={{ max: "150px" }}>
          <ChartLabelValues
            labelValues={sortedValues}
            selectedLabels={selectedLabels}
            label={label}
            onChange={onItemClick}
          />
        </Flex>
      </Collapsible>
    </Flex>
  )
}

const renderItem = defaultChartLabelValues => props =>
  <Item defaultChartLabelValues={defaultChartLabelValues} {...props} />

const renderDropdown = resetSelections => props =>
  (
    <Flex
      alignItems="center"
      background="dropdown"
      column
      justifyContent="center"
      margin={[1, 0, 0]}
    >
      <Reset attribute="filteredLabels" resetFunction={resetSelections} />
      <Dropdown hideShadow {...props} />
    </Flex>
  )

const getLabel = values => {
  const length = Object.keys(values).reduce((acc, key) => {
    const currentValue = values[key].includes("|") ? values[key].split("|").length : 1
    acc += currentValue
    return acc
  }, 0)

  return `${length || ""} condition${length === 1 ? "" : "s"}`
}

const tooltipProps = {
  heading: "Chart Labels",
  body: "Select one, multiple or all chart labels",
}

const normalizeData = (data = {}) =>
  Object.keys(data).reduce((acc, key) => {
    acc[key] = data[key].join("|")
    return acc
  }, {})

const ChartLabels = ({ labelProps, ...rest }) => {
  const chart = useChart()

  const selectedChartLabels = useAttributeValue("filteredLabels")
  const { chartLabels } = useMetadata()

  const [selectedLabels, setSelectedLabels] = useState(normalizeData(selectedChartLabels))

  useEffect(() => setSelectedLabels(normalizeData(selectedChartLabels)), [selectedChartLabels])

  const chartLabelsOptions = useMemo(
    () => Object.keys(chartLabels).map(key => ({ label: key, values: chartLabels[key] })),
    []
  )
  const Item = useMemo(() => {
    const labelOptions = chartLabelsOptions.reduce((acc, { label, values }) => {
      acc[label] = values.join("|")
      return acc
    }, {})
    return renderItem(labelOptions)
  }, [])

  const onChange = ({ label, value }) => {
    const selectedLabels = onLabelValueClick({ label, value })

    const labelsToSet = Object.keys(selectedLabels).reduce((acc, key) => {
      acc[key] = selectedLabels[key].includes("|")
        ? selectedLabels[key].split("|")
        : [selectedLabels[key]]
      return acc
    }, {})

    chart.updateFilteredLabelsAttribute(labelsToSet)
  }

  const onLabelValueClick = ({ label, value }) => {
    const labelsToSet = { ...selectedLabels }

    const isValueSelected = checkIfValueIsSelected({ label, value, selectedLabels: labelsToSet })

    if (!isValueSelected) {
      labelsToSet[label] = labelsToSet[label] ? `${labelsToSet[label]}|${value}` : value
    } else {
      if (labelsToSet[label] === value) delete labelsToSet[label]
      else {
        const selectedLabelsArr = labelsToSet[label]
          .split("|")
          .filter(v => v !== value)
          .join("|")

        labelsToSet[label] = selectedLabelsArr
      }
    }

    return labelsToSet
  }

  const resetSelections = useCallback(() => {
    setSelectedLabels({})
    chart.updateFilteredLabelsAttribute({})
  }, [])

  const Dropdown = useMemo(() => renderDropdown(resetSelections))

  if (!chartLabelsOptions.length) return null
  return (
    <Menu
      value={selectedLabels}
      onChange={onChange}
      items={chartLabelsOptions}
      Item={Item}
      Dropdown={Dropdown}
      closeOnClick={false}
      data-track={chart.track("chartLabels")}
      dropProps={{
        align: { top: "bottom", left: "left" },
        "data-toolbox": true,
      }}
      dropdownProps={{
        height: { max: "60vh" },
        width: "230px",
        overflow: "auto",
      }}
      resetSelections={resetSelections}
      {...rest}
    >
      <Label
        secondaryLabel="filtered by"
        label={getLabel(selectedLabels)}
        title={tooltipProps.heading}
        tooltipProps={tooltipProps}
        {...labelProps}
      />
    </Menu>
  )
}

export default ChartLabels
