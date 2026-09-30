import React, { useEffect, useState, useMemo, useCallback } from "react"
import styled from "styled-components"
import { Flex, TextSmall, Table, Button, Checkbox, getColor } from "@netdata/netdata-ui"
import { useChart, useAttributeValue } from "@/components/provider"
import { radius } from "@/components/modern/tokens"
import { uppercase } from "@/helpers/objectTransform"
import deepEqual from "@/helpers/deepEqual"
import Totals from "../totals"
import { modernizeColumns, columnNames, defaultHiddenColumns } from "./columns"

const Container = styled(Flex)`
  box-shadow: 0 18px 28px ${getColor("dropdownShadow")};
  border: 1px solid ${getColor("border")};
  border-radius: ${radius.card};
  list-style-type: none;
  overflow: hidden;
  * {
    box-sizing: border-box;
  }
  [data-testid^="netdata-table-row"] {
    border-bottom-color: transparent;
  }
`

export const modernMeta = (row, cell, index) => ({
  cellStyles: {
    padding: [1, 2],
    ...(row.depth > 0 && { backgroundOpacity: 0.4 }),
    ...(row.depth > 0 && index === 0 && { border: { side: "left", size: "4px" } }),
  },
  headStyles: {
    height: { min: "28px" },
    padding: [1, 2],
  },
})

const noop = () => {}

// Menu hands these to every Dropdown; they must not reach the DOM container.
const menuOnlyProps = [
  "title",
  "dropTitle",
  "dropTitlePadding",
  "items",
  "itemProps",
  "Item",
  "Footer",
  "hasSearch",
]

const omitMenuProps = props =>
  Object.fromEntries(Object.entries(props).filter(([key]) => !menuOnlyProps.includes(key)))

const getSelectedIds = values => (values || []).map(v => v?.value ?? v).sort()

// Mirrors what the table reports as selected, so Reset is enabled only after a real change.
const collectSelected = (options, result = []) =>
  options.reduce((h, option) => {
    if (option.selected && !option.disabled && !option.unselectable) h.push(option)
    if (option.children) collectSelected(option.children, h)
    return h
  }, result)

const buildSelections = (options, result, parentIndex) =>
  options.reduce((h, dim, index) => {
    if (typeof parentIndex !== "undefined") index = `${parentIndex}.${index}`

    if (dim.selected) h[index] = true

    if (dim.children) buildSelections(dim.children, h, index)

    return h
  }, result)

export const useColumnVisibility = columns => {
  const chart = useChart()
  const stored = useAttributeValue("filterColumnVisibility")

  const toggleable = useMemo(
    () => columns.filter(column => columnNames[column.id]).map(column => column.id),
    [columns]
  )

  const visibility = useMemo(() => ({ ...defaultHiddenColumns, ...stored }), [stored])

  const toggle = useCallback(
    id =>
      chart.updateAttribute("filterColumnVisibility", {
        ...visibility,
        [id]: visibility[id] === false,
      }),
    [chart, visibility]
  )

  return { toggleable, visibility, toggle }
}

const ColumnToggles = ({ toggleable, visibility, toggle }) => (
  <Flex data-testid="modern-filter-columns" gap={3} flexWrap width="100%" padding={[1, 0, 0]}>
    {toggleable.map(id => (
      <Checkbox
        key={id}
        data-testid={`modern-filter-column-${id}`}
        checked={visibility[id] !== false}
        onChange={() => toggle(id)}
        label={columnNames[id]}
        labelProps={{ color: "textDescription" }}
        Label={TextSmall}
      />
    ))}
  </Flex>
)

const ModernDropdown = ({
  getOptions,
  onItemClick,
  columns,
  sortBy,
  onSortByChange,
  expanded,
  onExpandedChange,
  tableMeta,
  enableSubRowSelection,
  value,
  newValues,
  totals,
  emptyMessage,
  filterSelectedCount = arr => arr,
  sidebar,
  totalSelected,
  resourceName,
  defaultMeta,
  close,
  ...rest
}) => {
  const chart = useChart()
  const items = useMemo(getOptions, [getOptions])
  const [rowSelection, setRowSelection] = useState(() => buildSelections(items, {}))
  const [showColumns, setShowColumns] = useState(false)

  useEffect(() => {
    const newSelections = buildSelections(items, {})
    setRowSelection(prev => (deepEqual(prev, newSelections) ? prev : newSelections))
  }, [])

  const initialIds = useMemo(() => getSelectedIds(collectSelected(items)), [items])
  const hasChanges = useMemo(
    () => !!newValues && !deepEqual(initialIds, getSelectedIds(newValues)),
    [initialIds, newValues]
  )

  const selectedCount = useMemo(
    () => (!newValues?.length ? 0 : filterSelectedCount(newValues).length),
    [newValues]
  )
  const totalCount = (totals?.sl || 0) + (totals?.ex || 0) || items.length

  const nameHeader = resourceName ? uppercase(chart.intl(resourceName)) : "Name"
  const pluralName = resourceName ? chart.intl(resourceName, { count: items.length }) : "options"

  const modernColumns = useMemo(() => modernizeColumns(columns, { nameHeader }), [columns])
  const { toggleable, visibility, toggle } = useColumnVisibility(columns)

  const placeholder = `Search ${items.length} ${pluralName}`
  const meta = useMemo(() => {
    if (tableMeta && tableMeta !== defaultMeta) return tableMeta

    return (row, cell, index) => ({
      ...modernMeta(row, cell, index),
      searchStyles: { autoFocus: true, placeholder },
      bulkActionsStyles: {
        background: "mainBackground",
        border: { side: "bottom", color: "borderSecondary" },
      },
    })
  }, [tableMeta])

  return (
    <Container
      role="listbox"
      background="mainBackground"
      padding={[0]}
      margin={[1, 0]}
      column
      tabindex="-1"
      flex
      data-testid="modern-filter-dropdown"
      {...omitMenuProps(rest)}
    >
      <Flex overflow="hidden">
        <Table
          enableResizing
          enableSorting
          enableSelection
          dataColumns={modernColumns}
          data={items}
          onRowSelected={onItemClick}
          onSearch={noop}
          headerChildren={
            !!toggleable.length && (
              <>
                <Button
                  flavour="borderless"
                  small
                  padding={[0, 1]}
                  label="Columns"
                  onClick={() => setShowColumns(open => !open)}
                  data-testid="modern-filter-columns-toggle"
                  aria-expanded={showColumns}
                />
                {showColumns && (
                  <ColumnToggles toggleable={toggleable} visibility={visibility} toggle={toggle} />
                )}
              </>
            )
          }
          meta={meta}
          sortBy={sortBy}
          rowSelection={rowSelection}
          onSortingChange={onSortByChange}
          expanded={expanded}
          onExpandedChange={onExpandedChange}
          enableSubRowSelection={enableSubRowSelection}
          columnVisibility={visibility}
          coloredSortedColumn={false}
          width={{ base: 250, max: "80vw" }}
        />
        {sidebar}
      </Flex>

      <Flex
        padding={[2, 3]}
        gap={2}
        justifyContent="between"
        alignItems="center"
        border={{ side: "top", color: "borderSecondary" }}
      >
        <Flex column gap={0.5}>
          <TextSmall color="textDescription" data-testid="modern-filter-selected">
            {`${selectedCount} of ${totalCount} selected`}
          </TextSmall>
          {totals && <Totals selected={value} totalSelected={totalSelected} {...totals} />}
          {!newValues?.length && !!emptyMessage && (
            <TextSmall color="warningText">{emptyMessage}</TextSmall>
          )}
        </Flex>
        <Flex gap={2} alignItems="center" flex={false}>
          <Button
            flavour="borderless"
            small
            padding={[0, 1]}
            label="Clear"
            disabled={!newValues?.length && !value.length}
            onClick={() => {
              setRowSelection({})
              onItemClick([])
            }}
            data-testid="modern-filter-clear"
          />
          <Button
            flavour="borderless"
            small
            padding={[0, 1]}
            label="Reset"
            disabled={!hasChanges}
            onClick={() => setRowSelection(buildSelections(items, {}))}
            data-testid="modern-filter-reset"
          />
          <Button small label="Apply" onClick={close || noop} data-testid="modern-filter-apply" />
        </Flex>
      </Flex>
    </Container>
  )
}

export default ModernDropdown
