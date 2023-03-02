import React, { useEffect, useState, useCallback, useMemo } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextSmall, TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { NetdataTable } from "@netdata/netdata-ui/lib/components/tableV2"
import Label from "./label"
import Totals from "./totals"

const Container = styled(Flex)`
  ${({ hideShadow }) =>
    !hideShadow && "box-shadow: 0 18px 28px rgba(9, 30, 66, 0.15), 0 0 1px rgba(9, 30, 66, 0.95);"}
  list-style-type: none;
  border-radius: 2px;
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
    padding: [4, 2, 1, 2],
  },
  searchStyles: {
    inputContainerStyles: {
      height: "20px",
      border: { side: "all", size: "1px", color: "inputBg" },
      background: "inputBg",
      round: true,
      padding: [1, 2],
      _hover: {
        border: { side: "all", size: "1px", color: "borderSecondary" },
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
  value,
  newValues,
  totals,
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
      {totals && (
        <Flex
          padding={[2]}
          justifyContent="between"
          alignItems="center"
          border={{ side: "top", color: "borderSecondary" }}
        >
          <Flex gap={1} alignItems="end">
            <TextSmall color="textLite">
              Selected{" "}
              <TextSmall strong>
                {newValues.length || (totals.sl || 0) + (totals.ex || 0)}
              </TextSmall>{" "}
              out of <TextSmall strong>{(totals.sl || 0) + (totals.ex || 0)}</TextSmall>
            </TextSmall>
            <TextMicro cursor="pointer" color="primary" onClick={() => onItemClick([])}>
              clear
            </TextMicro>
            <TextMicro cursor="pointer" color="primary" onClick={() => onItemClick(value)}>
              undo
            </TextMicro>
          </Flex>

          <Totals selected={value} {...totals} />
        </Flex>
      )}
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
  totals,
  ...rest
}) => {
  const [newValues, setNewValues] = useState(value)

  useEffect(() => {
    setNewValues(value)
  }, [value])

  const onSelect = useCallback(val => setNewValues(val), [])

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
        height: { max: "80vh" },
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
        value,
        totals,
        newValues,
      }}
      value={value}
      onClose={() => onChange(newValues)}
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
