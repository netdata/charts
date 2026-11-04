import React, { useMemo, useRef, useState } from "react"
import styled from "styled-components"
import { Box, Drop, Flex, TextMicro } from "@netdata/netdata-ui"
import Search from "@netdata/netdata-ui/dist/components/search"
import searchIcon from "@netdata/netdata-ui/dist/components/icon/assets/search.svg"
import moreIcon from "@netdata/netdata-ui/dist/components/icon/assets/more.svg"
import Icon, { Button } from "@/components/icon"
import { useAttribute, useAttributeValue, useChart, usePayload } from "@/components/provider"
import Fullscreen from "@/components/toolbox/fullscreen"
import SettingsContent from "@/components/toolbox/settings/content"
import ModernTitle from "@/components/modern/header/title"
import FiltersSwap from "@/components/modern/header/filtersSwap"
import StatusIndicator, { getClearDescription, summarizeAlerts } from "@/components/modern/status"
import { Toolbar, dropProps } from "@/components/modern/menu"
import { useValueFocus } from "@/components/modern/focus"
import { formatWindowDuration, getWindowSeconds } from "@/helpers/valueFocus"
import TableMenu from "./menu"
import { DeltaPill } from "./columns"

export const getTableStatus = alerts => {
  const summary = summarizeAlerts(alerts)
  if (!summary.watching) return null

  if (summary.critical.count)
    return { status: "critical", count: summary.critical.count, names: summary.raisedNames }

  if (summary.warning.count)
    return { status: "warning", count: summary.warning.count, names: summary.raisedNames }

  return { status: "clear", description: getClearDescription(summary.watching) }
}

const TableStatus = () => {
  const alerts = useAttributeValue("alerts")
  const status = useMemo(() => getTableStatus(alerts), [alerts])

  if (!status) return null

  return <StatusIndicator {...status} data-testid="modernTable-alerts" />
}

const KeyGlyph = styled(Box)`
  display: inline-block;
  vertical-align: middle;
`

const trendKeyText = "dot = now · line = share of column max"

const keyTrendPath = "M0,7 L3,7 L5,4 L8,5 L10,2"

const TrendKey = ({ window }) => (
  <>
    <KeyGlyph as="svg" width="14px" height="8px" viewBox="0 0 14 8" aria-hidden="true">
      <path d={keyTrendPath} fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="11" cy="2" r="1.6" fill="currentColor" />
    </KeyGlyph>
    {window ? ` last ${window} · ${trendKeyText}` : ` ${trendKeyText}`}
  </>
)

const ChangeKey = ({ window }) => (
  <>
    <DeltaPill as="span">+n</DeltaPill>
    {window ? ` change in ${window}` : " change"}
  </>
)

const keysByFocus = { changes: ChangeKey, trends: TrendKey }

const TableKey = () => {
  const chart = useChart()
  usePayload()
  const focus = useValueFocus("table")
  const Key = keysByFocus[focus]

  if (!Key) return null

  return (
    <TextMicro color="textLite" whiteSpace="nowrap" truncate data-testid="modernTable-key">
      <Key window={formatWindowDuration(getWindowSeconds(chart))} />
    </TextMicro>
  )
}

const SearchField = ({ value, onChange, onClose }) => (
  <Flex width="200px" data-testid="modernTable-searchField">
    <Search
      value={value}
      onChange={onChange}
      placeholder="Filter rows"
      autoFocus
      onKeyDown={event => event.key === "Escape" && onClose()}
      data-testid="modernTable-search"
    />
  </Flex>
)

const ModernTableHeader = ({
  columns,
  columnVisibility,
  onColumnVisibilityChange,
  hasFilters = true,
}) => {
  const chart = useChart()
  const moreRef = useRef()
  const focused = useAttributeValue("focused")
  const hideTitle = useAttributeValue("hideTitle")
  const searchQuery = useAttributeValue("searchQuery")
  const toolboxElements = useAttributeValue("toolboxElements") || []
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useAttribute("filtersOpen")

  const searching = searchOpen || !!searchQuery
  const setQuery = value => chart.updateAttribute("searchQuery", value)
  const closeSearch = () => {
    setSearchOpen(false)
    setQuery("")
  }
  const closeMenu = () => setMenuOpen(false)
  const closeSettings = () => setSettingsOpen(false)
  const openSettings = () => {
    setMenuOpen(false)
    setSettingsOpen(true)
  }

  return (
    <Flex
      justifyContent="between"
      alignItems="start"
      gap={3}
      padding={[2, 3, 1]}
      width="100%"
      data-testid="modernTableHeader"
    >
      <Flex column gap={0.5} flex="shrink" overflow="hidden" width={{ min: "0px" }}>
        {!hideTitle && (
          <Flex alignItems="center" gap={2} height={{ min: "24px" }}>
            <ModernTitle withUnits={false} />
          </Flex>
        )}
        <FiltersSwap
          hasFilters={hasFilters}
          open={hasFilters && !!filtersOpen}
          onToggle={() => setFiltersOpen(prev => !prev)}
          onClose={() => setFiltersOpen(false)}
        />
        <TableKey />
      </Flex>
      <Flex alignItems="center" gap={2} flex={false} height={{ min: "24px" }}>
        {searching && (
          <SearchField value={searchQuery || ""} onChange={setQuery} onClose={closeSearch} />
        )}
        <Toolbar
          data-noprint
          data-testid="modernTable-actions"
          opacity={focused || searching || menuOpen || settingsOpen ? 1 : 0}
        >
          <Button
            icon={<Icon svg={searchIcon} size="16px" />}
            title={searching ? "Close search" : "Search"}
            active={searching}
            aria-pressed={searching}
            onClick={() => (searching ? closeSearch() : setSearchOpen(true))}
            data-testid="modernTable-searchToggle"
            data-track={chart.track("search")}
          />
          {toolboxElements.includes(Fullscreen) && <Fullscreen />}
          <Button
            ref={moreRef}
            icon={<Icon svg={moreIcon} width="16px" height="16px" />}
            title="More"
            active={menuOpen}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => {
              setSettingsOpen(false)
              setMenuOpen(prev => !prev)
            }}
            data-testid="modernTable-more"
            data-track={chart.track("more")}
          />
          {moreRef.current && menuOpen && (
            <Drop
              target={moreRef.current}
              onEsc={closeMenu}
              onClickOutside={closeMenu}
              data-toolbox={chart.getId()}
              {...dropProps}
            >
              <TableMenu
                columns={columns}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={onColumnVisibilityChange}
                onClose={closeMenu}
                onOpenSettings={openSettings}
              />
            </Drop>
          )}
          {moreRef.current && settingsOpen && (
            <Drop
              target={moreRef.current}
              onEsc={closeSettings}
              onClickOutside={closeSettings}
              data-toolbox={chart.getId()}
              {...dropProps}
              background="modalBackground"
            >
              <SettingsContent chart={chart} onClose={closeSettings} />
            </Drop>
          )}
        </Toolbar>
        <TableStatus />
      </Flex>
    </Flex>
  )
}

export default ModernTableHeader
