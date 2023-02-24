import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { NetdataTable } from "@netdata/netdata-ui/lib/components/tableV2"
import Label from "./label"

const Container = styled(Flex)`
  ${({ hideShadow }) =>
    !hideShadow &&
    "box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2), 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);"}
  list-style-type: none;
`

const noop = () => {}

const Dropdown = ({ hideShadow, items, onItemClick, close, columns, ...rest }) => {
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
      <NetdataTable
        enableSorting
        enableSelection
        dataColumns={columns}
        data={items}
        onRowSelected={selected => onItemClick(selected.map(s => s.value))}
        onGlobalSearchChange={noop}
        // bulkActions={bulkActions}
        // rowActions={rowActions}
      />
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
  columns,
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
        columns,
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
