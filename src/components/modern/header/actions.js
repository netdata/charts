import React, { useRef, useState } from "react"
import styled from "styled-components"
import { Drop, Flex } from "@netdata/netdata-ui"
import filterIcon from "@netdata/netdata-ui/dist/components/icon/assets/filter.svg"
import moreIcon from "@netdata/netdata-ui/dist/components/icon/assets/more.svg"
import Icon, { Button } from "@/components/icon"
import { useAttributeValue, useChart } from "@/components/provider"
import SettingsContent from "@/components/toolbox/settings/content"
import MoreMenu from "./moreMenu"

const Container = styled(Flex).attrs({ alignItems: "center", gap: 0.5 })`
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 120ms ease-in-out;

  &:focus-within {
    opacity: 1;
  }
`

const dropProps = {
  align: { top: "bottom", right: "right" },
  background: "dropdown",
  margin: [1, 0, 0],
  round: true,
}

const Actions = ({ hasFilters, filtersOpen, onToggleFilters }) => {
  const chart = useChart()
  const moreRef = useRef()
  const focused = useAttributeValue("focused")
  const toolboxElements = useAttributeValue("toolboxElements")
  const settingsTabs = useAttributeValue("settingsTabs") || []
  const [menuOpen, setMenuOpen] = useState(false)
  const [tabIndex, setTabIndex] = useState(null)

  const closeMenu = () => setMenuOpen(false)
  const closeTab = () => setTabIndex(null)
  const openTab = index => {
    setMenuOpen(false)
    setTabIndex(index)
  }

  const tabOpen = tabIndex !== null

  const disabled = !focused

  return (
    <Container
      data-noprint
      data-testid="chartHeaderToolbox"
      $visible={focused || menuOpen || tabOpen || filtersOpen}
    >
      {hasFilters && (
        <Button
          icon={<Icon svg={filterIcon} size="16px" />}
          title={filtersOpen ? "Hide filters" : "Filters"}
          active={filtersOpen}
          aria-pressed={filtersOpen}
          onClick={onToggleFilters}
          data-testid="chartHeaderToolbox-filters"
          data-track={chart.track("filters")}
        />
      )}
      {toolboxElements &&
        toolboxElements.map((Element, index) => <Element key={index} disabled={disabled} />)}
      <Button
        ref={moreRef}
        icon={<Icon svg={moreIcon} width="16px" height="16px" />}
        title="More"
        active={menuOpen}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(prev => !prev)}
        data-testid="chartHeaderToolbox-more"
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
          <MoreMenu onClose={closeMenu} onOpenTab={openTab} />
        </Drop>
      )}
      {moreRef.current && tabOpen && (
        <Drop
          target={moreRef.current}
          onEsc={closeTab}
          onClickOutside={closeTab}
          data-toolbox={chart.getId()}
          {...dropProps}
          background="modalBackground"
        >
          <SettingsContent
            chart={chart}
            onClose={closeTab}
            initialTab={settingsTabs[tabIndex]?.id}
            initialIndex={tabIndex}
          />
        </Drop>
      )}
    </Container>
  )
}

export default Actions
