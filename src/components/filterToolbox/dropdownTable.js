import React, { useEffect, useState, useMemo } from "react"
import styled from "styled-components"
import { Flex, TextSmall, Menu, NetdataTable, Button, getColor } from "@netdata/netdata-ui"
import deepEqual from "@/helpers/deepEqual"
import Label from "./label"
import Totals from "./totals"

const Container = styled(Flex)`
  box-shadow: 0 18px 28px ${getColor("dropdownShadow")};
  list-style-type: none;
  border-radius: 2px;
  border: 1px solid ${getColor("borderSecondary")};
  * {
    box-sizing: border-box;
  }
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
    padding: [2, 0],
  },
  searchContainerStyles: {
    width: "100%",
    padding: [0, 2, 0, 2],
  },
  searchStyles: {
    inputContainerStyles: {
      height: "32px",
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
const defaultFilterSelectedCount = () => true

const Dropdown = ({
  getOptions,
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
  emptyMessage,
  title,
  filterSelectedCount = defaultFilterSelectedCount,
  ...rest
}) => {
  const items = useMemo(getOptions, [])
  const [rowSelection, setRowSelection] = useState(() => buildSelections(items, {}))

  useEffect(() => {
    const newSelections = buildSelections(items, {})
    setRowSelection(prev => (deepEqual(prev, newSelections) ? prev : newSelections))
  }, [])

  const hasChanges = useMemo(() => !!newValues && deepEqual(value, newValues), [newValues])
  const newValuesCount = useMemo(
    () => (!newValues?.length ? 0 : filterSelectedCount(newValues)),
    [newValues]
  )

  return (
    <Container
      role="listbox"
      background="dropdown"
      padding={[0]}
      margin={[1, 0]}
      column
      tabindex="-1"
      flex
      {...rest}
    >
      <NetdataTable
        title={title}
        background="dropdownTable"
        enableResize
        enableSorting
        enableSelection
        dataColumns={columns}
        data={items}
        onRowSelected={onItemClick}
        onGlobalSearchChange={noop}
        meta={tableMeta}
        sortBy={sortBy}
        rowSelection={rowSelection}
        onSortingChange={onSortByChange}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        enableSubRowSelection={enableSubRowSelection}
        width={{ base: 250, max: "80vw" }}
        // bulkActions={bulkActions}
        // rowActions={rowActions}
      />
      <Flex
        padding={[2]}
        justifyContent="between"
        alignItems="center"
        border={{ side: "top", color: "borderSecondary" }}
      >
        <Flex gap={1} alignItems="center">
          <TextSmall color="textLite">
            Selected <TextSmall strong>{newValuesCount}</TextSmall> out of{" "}
            <TextSmall strong>{(totals?.sl || 0) + (totals?.ex || 0) || items.length}</TextSmall>
          </TextSmall>
          <Button
            padding={[0]}
            flavour="borderless"
            width="auto"
            height="auto"
            cursor="pointer"
            color="primary"
            onClick={() => {
              setRowSelection({})
              onItemClick([])
            }}
            disabled={!newValues?.length && !value.length}
            label="clear"
            small
          />
          <Button
            padding={[0]}
            flavour="borderless"
            width="auto"
            height="auto"
            cursor="pointer"
            color="primary"
            onClick={() => {
              setRowSelection({ ...rowSelection })
              onItemClick(value)
            }}
            disabled={!hasChanges}
            label="reset"
            small
          />
          {!newValues?.length && !!emptyMessage && (
            <TextSmall color="warningText">{emptyMessage}</TextSmall>
          )}
        </Flex>
        {totals && <Totals selected={value} {...totals} />}
      </Flex>
    </Container>
  )
}

const buildSelections = (options, result, parentIndex) =>
  options.reduce((h, dim, index) => {
    if (typeof parentIndex !== "undefined") index = `${parentIndex}.${index}`

    if (dim.selected) h[index] = true

    if (dim.children) buildSelections(dim.children, h, index)

    return h
  }, result)

const DropdownTable = ({
  label,
  labelProps,
  onChange,
  getOptions,
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
  emptyMessage,
  resourceName,
  title,
  filterSelectedCount,
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [newValues, setNewValues] = useState()

  useEffect(() => {
    if (isOpen || !newValues) return

    onChange(newValues)
  }, [isOpen])

  return (
    <Menu
      onChange={setNewValues}
      hasSearch={false}
      closeOnClick={false}
      Dropdown={Dropdown}
      dropProps={{
        align: { top: "bottom", left: "left" },
        "data-toolbox": true,
        keepHorizontal: true,
        stretch: null,
      }}
      dropdownProps={{
        height: { max: "60vh" },
        width: "100%",
        overflow: "auto",
        columns,
        getOptions,
        sortBy,
        onSortByChange,
        expanded,
        onExpandedChange,
        tableMeta,
        enableSubRowSelection,
        value,
        totals,
        newValues,
        emptyMessage,
        title,
        filterSelectedCount,
      }}
      value={value}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      {...rest}
    >
      <Label
        data-value={value.join("|") || `${resourceName} all-selected`}
        secondaryLabel={secondaryLabel}
        label={label || <Totals selected={value} {...totals} resourceName={resourceName} teaser />}
        title={tooltipProps.heading}
        tooltipProps={tooltipProps}
        {...labelProps}
      />
    </Menu>
  )
}

export default DropdownTable
