import React, { useRef, useState } from "react"
import { Drop } from "@netdata/netdata-ui"
import moreIcon from "@netdata/netdata-ui/dist/components/icon/assets/more.svg"
import Icon, { Button } from "@/components/icon"
import { useAttributeValue, useChart } from "@/components/provider"
import SettingsContent from "@/components/toolbox/settings/content"
import { Toolbar, dropProps } from "@/components/modern/menu"
import MoreMenu from "./moreMenu"

const closedDrill = { id: null, from: null }

export const MenuEffects = () => {
  const toolboxElements = useAttributeValue("toolboxElements") || []

  return toolboxElements
    .filter(Element => !!Element?.menu?.Effects)
    .map(Element => <Element.menu.Effects key={Element.menu.id} />)
}

const Actions = ({ hasFilters, filtersOpen, onToggleFilters }) => {
  const chart = useChart()
  const moreRef = useRef()
  const focused = useAttributeValue("focused")
  const settingsTabs = useAttributeValue("settingsTabs") || []
  const [menuOpen, setMenuOpen] = useState(false)
  const [tabIndex, setTabIndex] = useState(null)
  const [drill, setDrill] = useState(closedDrill)

  const closeMenu = () => {
    setMenuOpen(false)
    setDrill(closedDrill)
  }
  const closeTab = () => setTabIndex(null)
  const openTab = index => {
    closeMenu()
    setTabIndex(index)
  }
  const drillIn = id => setDrill({ id, from: null })
  const back = () => setDrill(prev => ({ id: null, from: prev.id }))

  const tabOpen = tabIndex !== null
  const visible = focused || menuOpen || tabOpen

  return (
    <Toolbar
      data-noprint
      data-testid="chartHeaderToolbox"
      data-hidden={!visible}
      opacity={visible ? 1 : 0}
      position="absolute"
      top="0"
      right="0"
      height="100%"
      padding={[0, 0, 0, 2]}
      background="mainChartBg"
    >
      <MenuEffects />
      <Button
        ref={moreRef}
        icon={<Icon svg={moreIcon} width="16px" height="16px" />}
        title="More"
        active={menuOpen}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
        data-testid="chartHeaderToolbox-more"
        data-track={chart.track("more")}
      />
      {moreRef.current && menuOpen && (
        <Drop
          target={moreRef.current}
          onEsc={drill.id ? back : closeMenu}
          onClickOutside={closeMenu}
          data-toolbox={chart.getId()}
          {...dropProps}
        >
          <MoreMenu
            onClose={closeMenu}
            onOpenTab={openTab}
            drill={drill.id}
            returnTo={drill.from}
            onDrill={drillIn}
            onBack={back}
            hasFilters={hasFilters}
            filtersOpen={filtersOpen}
            onToggleFilters={onToggleFilters}
          />
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
