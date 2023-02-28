import React, { useEffect, useRef, useCallback, useMemo } from "react"
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
export const meta = (row, cell, index) => ({
  cellStyles: {
    height: "40px",
    ...(row?.getIsExpanded?.() && { background: "columnHighlight", backgroundOpacity: 0.7 }),
    ...(row.depth > 0 && { backgroundOpacity: 0.4 }),
    ...(row.depth > 0 && index === 0 && { border: { side: "left", size: "4px" } }),
  },
  headStyles: {
    height: "32px",
  },
  styles: { verticalAlign: "middle" },
  bulkActionsStyles: {
    padding: [0, 0, 2],
  },
  searchContainerStyles: {
    width: "100%",
    padding: [2],
  },
  searchStyles: {
    inputContainerStyles: {
      height: "20px",
      border: { side: "bottom", size: "1px", color: "inputBorder" },
      padding: [1, 2],
      round: false,
      _hover: {
        border: { side: "bottom", size: "1px", color: "inputBorderHover" },
      },
    },
  },
})

const noop = () => {}

const defaultSortBy = [{ id: "contribution", desc: true }]

const defaultExpanded = {}

const Dropdown = ({
  hideShadow,
  rowSelection,
  items,
  onItemClick,
  close,
  columns,
  sortBy,
  onSortByChange,
  expanded,
  onExpandedChange,
  tableMeta = meta,
  enableSubRowSelection,
  ...rest
}) => {
  return (
    <Container
      role="listbox"
      background="dropdown"
      hideShadow={hideShadow}
      padding={[0]}
      margin={[1, 0]}
      column
      tabindex="-1"
      flex
      {...rest}
    >
      <NetdataTable
        enableSorting
        enableSelection
        dataColumns={columns}
        data={items}
        onRowSelected={onItemClick}
        onGlobalSearchChange={noop}
        sx={{
          borderCollapse: "collapse",
        }}
        meta={tableMeta}
        sortBy={sortBy}
        rowSelection={rowSelection}
        onSortingChange={onSortByChange}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        enableSubRowSelection={enableSubRowSelection}
        // bulkActions={bulkActions}
        // rowActions={rowActions}
      />
    </Container>
  )
}

const buildSelections = (options, result, parentIndex) =>
  options.reduce((h, dim, index) => {
    if (typeof parentIndex !== "undefined") index = `${parentIndex}.${index}`

    if (dim.selected) h[index] = true

    if (dim.children) h = buildSelections(dim.children, h, index)

    return h
  }, result)

const DropdownTable = ({
  label,
  labelProps,
  onChange,
  options,
  secondaryLabel,
  tooltipProps,
  value,
  columns,
  sortBy = defaultSortBy,
  onSortByChange,
  expanded = defaultExpanded,
  onExpandedChange,
  tableMeta,
  enableSubRowSelection,
  ...rest
}) => {
  const newValuesRef = useRef(value)

  useEffect(() => {
    newValuesRef.current = value
  }, [value])

  const onSelect = useCallback(val => (newValuesRef.current = val), [])

  const rowSelection = useMemo(() => buildSelections(options, {}), [options])

  return (
    <Menu
      onChange={onSelect}
      items={options}
      hasSearch={false}
      closeOnClick={false}
      Dropdown={Dropdown}
      dropProps={{
        align: { top: "bottom", left: "left" },
        "data-toolbox": true,
        keepHorizontal: true,
        width: "90%",
        stretch: null,
      }}
      dropdownProps={{
        height: { max: "90vh" },
        width: "100%",
        overflow: "auto",
        columns,
        rowSelection,
        sortBy,
        onSortByChange,
        expanded,
        onExpandedChange,
        tableMeta,
        enableSubRowSelection,
      }}
      value={value}
      onClose={() => onChange(newValuesRef.current)}
      {...rest}
    >
      <Label
        secondaryLabel={secondaryLabel}
        label={label}
        title={tooltipProps.heading}
        tooltipProps={tooltipProps}
        {...labelProps}
      />
    </Menu>
  )
}

export default DropdownTable
