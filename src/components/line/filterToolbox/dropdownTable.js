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
  searchContainerStyles: {
    width: "100%",
    padding: [2, 2, 0],
  },
  enableSelectionSorting: true,
})

const noop = () => {}

const defaultSortBy = [{ id: "contribution", desc: true }]

const Dropdown = ({
  hideShadow,
  rowSelection,
  items,
  onItemClick,
  close,
  columns,
  sortBy,
  tableMeta = meta,
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
      width="800px"
      {...rest}
    >
      <NetdataTable
        enableSorting
        enableSelection
        dataColumns={columns}
        data={items}
        onRowSelected={selected => onItemClick({ values: selected.map(s => s.value), selected })}
        onGlobalSearchChange={noop}
        sx={{
          borderCollapse: "collapse",
        }}
        meta={tableMeta}
        sortBy={sortBy}
        rowSelection={rowSelection}
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
  tableMeta,
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
      }}
      dropdownProps={{
        height: { max: "60vh" },
        overflow: "auto",
        columns,
        rowSelection,
        sortBy,
        tableMeta,
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
