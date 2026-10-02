import React, { useRef, useState } from "react"
import { Drop } from "@netdata/netdata-ui"
import filterIcon from "@netdata/netdata-ui/dist/components/icon/assets/filter.svg"
import moreIcon from "@netdata/netdata-ui/dist/components/icon/assets/more.svg"
import Icon, { Button } from "@/components/icon"
import { useAttributeValue, useChart } from "@/components/provider"
import SettingsContent from "@/components/toolbox/settings/content"
import { Toolbar, dropProps } from "@/components/modern/menu"
import MoreMenu from "./moreMenu"

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
    <Toolbar
      data-noprint
      data-testid="chartHeaderToolbox"
      opacity={focused || menuOpen || tabOpen || filtersOpen ? 1 : 0}
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
    </Toolbar>
  )
}

export default Actions
