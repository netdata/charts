import React, { useState } from "react"
import styled from "styled-components"
import { Flex, getColor } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"
import Settings from "@/components/toolbox/settings"
import { getConsumerElements } from "@/components/modern/tile/menu"
import { TileMenuContext } from "@/components/modern/tile/context"

const Panel = styled(Flex).attrs({ column: true, padding: [1], width: "260px" })`
  font-size: 12.5px;
`

const Row = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  border: 0;
  border-radius: 5px;
  padding: 5px 10px;
  background: transparent;
  font-family: inherit;
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
  color: ${getColor("text")};

  &:hover {
    background: ${getColor("mainChartTboxHover")};
  }
`

const Check = styled.span`
  display: inline-block;
  flex: none;
  width: 16px;
  color: ${getColor("primary")};
`

const Content = styled.span`
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const Hint = styled.span`
  flex-shrink: 0;
  color: ${getColor("textLite")};
  white-space: nowrap;
`

const Divider = styled.div`
  height: 1px;
  margin: 4px 0;
  background: ${getColor("borderSecondary")};
`

const Item = ({ children, hint, check, ...rest }) => (
  <Row type="button" role="menuitem" {...rest}>
    <Content>
      {check !== undefined && <Check>{check ? "✓" : ""}</Check>}
      {children}
    </Content>
    {!!hint && <Hint>{hint}</Hint>}
  </Row>
)

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
      {elements.length > 0 && (
        <Flex
          alignItems="center"
          gap={1}
          padding={[0.5, 1.5, 1.5]}
          border={{ side: "bottom", color: "borderSecondary" }}
          margin={[0, 0, 1]}
          flexWrap
          data-testid="modernTableMenu-elements"
        >
          <TileMenuContext.Provider value>
            {elements.map((Element, index) => (
              <Element key={index} disabled={!focused} />
            ))}
          </TileMenuContext.Provider>
        </Flex>
      )}
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
