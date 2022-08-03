import React, { useEffect, useMemo, useState } from "react"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { ItemContainer } from "@netdata/netdata-ui/lib/components/drops/menu/dropdownItem"
import chevronDownIcon from "@netdata/netdata-ui/lib/components/icon/assets/chevron_down.svg"
import Dropdown from "@netdata/netdata-ui/lib/components/drops/menu/dropdown"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Checkbox } from "@netdata/netdata-ui/lib/components/checkbox"
import { useChart, useAttributeValue, useMetadata } from "@/components/provider"
import Label from "./label"
import ChartLabelValues from "./chartLabelValues"
import Reset from "./reset"
import { Collapsible } from "@netdata/netdata-ui"
import Icon from "@/components/icon"

const Item = ({ item, value: selectedLabels, onItemClick, defaultChartLabelValues }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { label, values } = item

  const isChecked = defaultChartLabelValues[label] === selectedLabels[label]
  const isIndeterminate = !isChecked && selectedLabels[label]?.length

  const sortedValues = useMemo(
    () => (Array.isArray(values) ? [...values].sort((a, b) => a.localeCompare(b)) : values),
    [values]
  )

  return (
    <Flex column width="230px">
      <ItemContainer alignItems="start" gap={2}>
        <Checkbox
          checked={isChecked}
          indeterminate={!!isIndeterminate}
          onChange={() => onItemClick({ label })}
          label={<TextSmall>{label}</TextSmall>}
        />
        <Icon
          svg={chevronDownIcon}
          onClick={() => setIsOpen(!isOpen)}
          rotate={isOpen ? 2 : 0}
          size="20px"
          color="border"
        />
      </ItemContainer>
      <Collapsible open={isOpen}>
        <Flex margin={[0, 0, 0, 6]} column>
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

const renderItem = defaultChartLabelValues => props => {
  const key = props.item.value || props.item.label
  return <Item key={key} defaultChartLabelValues={defaultChartLabelValues} {...props} />
}

const renderDropdown = resetSelections => props =>
  (
    <Flex background="dropdown" column justifyContent="center" alignItems="center">
      <Reset attribute="filteredLabels" resetFunction={resetSelections} />
      <Dropdown {...props} />
    </Flex>
  )

const getLabel = values => {
  const length = Object.keys(values).reduce((acc, key) => {
    const currentValue = values[key].includes("|") ? values[key].split("|").length : 1
    acc += currentValue
    return acc
  }, 0)

  return `${length || ""} label${length === 1 ? "" : "s"}`
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
    [chartLabels]
  )
  const defaultChartLabelValues = useMemo(
    () =>
      chartLabelsOptions.reduce((acc, { label, values }) => {
        acc[label] = values.join("|")
        return acc
      }, {}),
    [chartLabels]
  )

  const onChange = ({ label, value }) => {
    const selectedLabels = value ? onLabelValueClick({ label, value }) : onLabelClick(label)

    const labelsToSet = Object.keys(selectedLabels).reduce((acc, key) => {
      acc[key] = selectedLabels[key].includes("|")
        ? selectedLabels[key].split("|")
        : [selectedLabels[key]]
      return acc
    }, {})

    chart.updateFilteredLabelsAttribute(labelsToSet)
  }

  const onLabelClick = label => {
    const labelsToSet = { ...selectedLabels }
    const isChecked = defaultChartLabelValues[label] === selectedLabels[label]

    if (isChecked) {
      delete labelsToSet[label]
    } else labelsToSet[label] = defaultChartLabelValues[label]

    return labelsToSet
  }

  const onLabelValueClick = ({ label, value }) => {
    const labelsToSet = { ...selectedLabels }
    const shouldAddLabelValue = !labelsToSet[label]?.includes?.(value)

    if (shouldAddLabelValue) {
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

  const resetSelections = () => {
    setSelectedLabels({})
    chart.updateFilteredLabelsAttribute({})
  }

  if (!chartLabelsOptions.length) return null
  return (
    <Menu
      value={selectedLabels}
      onChange={onChange}
      items={chartLabelsOptions}
      renderItem={renderItem(defaultChartLabelValues)}
      renderDropdown={renderDropdown(resetSelections)}
      closeOnClick={false}
      data-track={chart.track("chartLabels")}
      dropProps={{
        height: { max: "460px" },
        overflow: "auto",
        align: { top: "bottom", left: "left" },
        "data-toolbox": true,
      }}
      resetSelections={resetSelections}
      {...rest}
    >
      <Label
        secondaryLabel="select"
        label={getLabel(selectedLabels)}
        title={tooltipProps.heading}
        tooltipProps={tooltipProps}
        {...labelProps}
      />
    </Menu>
  )
}

export default ChartLabels
