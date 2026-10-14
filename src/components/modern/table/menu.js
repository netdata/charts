import React, { useState } from "react"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"
import Settings from "@/components/toolbox/settings"
import { getConsumerElements } from "@/components/modern/tile/menu"
import { Divider, Item, MenuElements, Panel } from "@/components/modern/menu"

export const getColumnOptions = (columns = []) =>
  columns.flatMap(group =>
    (group.columns || []).map(column => {
      const groupLabel = typeof group.headerString === "function" ? group.headerString() : ""
      return {
        id: column.id,
        label: groupLabel ? `${groupLabel} ${column.name}` : column.name,
      }
    })
  )

const isVisible = (visibility = {}, id) => visibility[id] !== false

const Columns = ({ columns, columnVisibility, onColumnVisibilityChange }) => {
  const [open, setOpen] = useState(false)
  const options = getColumnOptions(columns)

  if (!options.length || !onColumnVisibilityChange) return null

  const shown = options.filter(({ id }) => isVisible(columnVisibility, id)).length

  return (
    <>
      <Item
        hint={`${shown} of ${options.length} shown`}
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
        data-testid="modernTableMenu-columns"
      >
        Columns
      </Item>
      {open && (
        <Flex column overflow={{ vertical: "auto" }} height={{ max: "240px" }}>
          {options.map(({ id, label }) => (
            <Item
              key={id}
              role="menuitemcheckbox"
              check={isVisible(columnVisibility, id)}
              aria-checked={isVisible(columnVisibility, id)}
              title={label}
              data-testid="modernTableMenu-column"
              data-column={id}
              onClick={() =>
                onColumnVisibilityChange(prev => ({ ...prev, [id]: !isVisible(prev, id) }))
              }
            >
              {label}
            </Item>
          ))}
        </Flex>
      )}
    </>
  )
}

const TableMenu = ({
  columns,
  columnVisibility,
  onColumnVisibilityChange,
  onClose,
  onOpenSettings,
}) => {
  const chart = useChart()
  const focused = useAttributeValue("focused")
  const toolboxElements = useAttributeValue("toolboxElements") || []
  const settingsTabs = useAttributeValue("settingsTabs") || []
  const elements = getConsumerElements(toolboxElements)
  const hasSettings = toolboxElements.includes(Settings) && settingsTabs.length > 0

  return (
    <Panel role="menu" data-testid="modernTableMenu">
      <MenuElements elements={elements} focused={focused} data-testid="modernTableMenu-elements" />
      <Columns
        columns={columns}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />
      <Divider />
      {hasSettings && (
        <Item
          data-testid="modernTableMenu-settings"
          data-track={chart.track("settings")}
          onClick={onOpenSettings}
        >
          Chart settings…
        </Item>
      )}
      <Item
        data-testid="modernTableMenu-reload"
        data-track={chart.track("refresh")}
        onClick={() => {
          chart.fetch()
          onClose()
        }}
      >
        Reload data
      </Item>
    </Panel>
  )
}

export default TableMenu
