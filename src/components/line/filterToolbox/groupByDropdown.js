import React, { useMemo } from "react"
import styled from "styled-components"
import { useChart, useMetadata } from "@/components/provider"
import {
  Flex,
  Text,
  TextSmall,
  TextMicro,
  Menu,
  MenuItemContainer,
  Checkbox,
} from "@netdata/netdata-ui"
import Label from "./label"

const Container = styled(Flex)`
  ${({ hideShadow }) =>
    !hideShadow &&
    "box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2), 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);"}
  list-style-type: none;
`

const GroupByItem = ({ label, dimensions }) => (
  <Flex column>
    <TextSmall strong>{label}</TextSmall>
    <TextMicro color="textLite">
      Metrics:{" "}
      {dimensions.slice(0, 3).map((dim, index, dims) => (
        <TextMicro key={dim.id + index} color="textLite">
          {index !== 0 && index === dims.length - 1 ? (
            <>
              {" "}
              and{" "}
              {dims.length !== dimensions.length ? (
                "others"
              ) : (
                <TextMicro strong color="textLite">
                  {dim.id}
                </TextMicro>
              )}
            </>
          ) : (
            <>
              {" "}
              <TextMicro strong color="textLite">
                {dim.id}
              </TextMicro>
              {index < dims.length - 2 ? "," : ""}
            </>
          )}
        </TextMicro>
      ))}
    </TextMicro>
  </Flex>
)

const GroupByLabelItem = ({ label, dimensions }) => (
  <Flex column>
    <TextSmall strong>{label}</TextSmall>
    <TextMicro as={Flex} color="textLite" column>
      {dimensions.map((dim, index) => (
        <TextMicro as={Flex} key={dim.id + index} color="textLite" gap={2}>
          <TextMicro as={Flex} flex={false} width={30} strong color="textLite">
            {dim.id}
          </TextMicro>
          <Flex flex={false} width={40}>
            metrics: {dim.ds.sl} out of {dim.ds.sl + dim.ds.ex}
          </Flex>
          <Flex flex={false} width={40}>
            contribution: {dim.sts.con}%
          </Flex>
        </TextMicro>
      ))}
    </TextMicro>
  </Flex>
)

const Item = ({ item, value, onItemClick, dimensions, type = "groupBy", ...rest }) => {
  const selectedValues = value[type]
  const checked = selectedValues.includes(item.value)

  return (
    <MenuItemContainer gap={2} justifyContent="between" {...rest}>
      <Checkbox
        labelProps={{ alignItems: "start" }}
        checked={checked}
        onChange={e => onItemClick({ value: item.value, checked: e.target.checked, type })}
        label={
          type === "groupBy" ? (
            <GroupByItem label={item.label || item.value} dimensions={dimensions} />
          ) : (
            <GroupByLabelItem label={item.label || item.value} dimensions={dimensions} />
          )
        }
      />
    </MenuItemContainer>
  )
}

const Dropdown = ({ hideShadow, items, itemProps, value, onItemClick, close, ...rest }) => {
  const chart = useChart()

  const { labels } = useMetadata()
  const labelOptions = useMemo(
    () =>
      labels.map(label => ({
        label: label.id,
        value: label.id,
        "data-track": chart.track(`group-by-label-${label.id}`),
        children: label.vl,
      })),
    [labels]
  )

  return (
    <Container
      role="listbox"
      background="dropdown"
      hideShadow={hideShadow}
      padding={[0]}
      margin={[1, 0]}
      column
      tabindex="-1"
      width="auto"
      {...rest}
    >
      {items.map(item => (
        <Item
          key={item.label}
          item={item}
          itemProps={itemProps}
          value={value}
          onItemClick={onItemClick}
          close={close}
          dimensions={item.children}
        />
      ))}
      <Text strong>Labels</Text>
      {labelOptions.map(option => (
        <Item
          key={option.label}
          item={option}
          itemProps={itemProps}
          value={value}
          onItemClick={onItemClick}
          close={close}
          type="groupByLabel"
          dimensions={option.children}
        />
      ))}
    </Container>
  )
}

const DropdownTable = ({
  allName,
  labelProps,
  onChange,
  options,
  renderLink,
  secondaryLabel,
  tooltipProps,
  value,
  ...rest
}) => {
  return (
    <Menu
      onChange={onChange}
      items={options}
      hasSearch={false}
      closeOnClick={false}
      Dropdown={Dropdown}
      dropProps={{
        align: { top: "bottom", left: "left" },
        "data-toolbox": true,
        keepHorizontal: true,
      }}
      dropdownProps={{
        height: { max: "60vh" },
        overflow: "auto",
      }}
      itemProps={{ allName, renderLink }}
      value={value}
      {...rest}
    >
      <Label
        secondaryLabel={secondaryLabel}
        label={options.length === 1 ? options[0].label : allName}
        title={tooltipProps.heading}
        tooltipProps={tooltipProps}
        {...labelProps}
      />
    </Menu>
  )
}

export default DropdownTable
