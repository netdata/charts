import { useEffect, useRef, useState } from "react"
import { Drop } from "@netdata/netdata-ui"
import moreIcon from "@netdata/netdata-ui/dist/components/icon/assets/more.svg"
import Icon, { Button } from "@/components/icon"
import { useAttribute, useAttributeValue, useChart } from "@/components/provider"
import SettingsContent from "@/components/toolbox/settings/content"
import { Toolbar, dropProps } from "@/components/modern/menu"
import MoreMenu from "./moreMenu"
import PinnedActions from "./pinnedActions"

const rootDrill = []

export const MenuEffects = () => {
  const toolboxElements = useAttributeValue("toolboxElements") || []

  return toolboxElements
    .filter(Element => !!Element?.menu?.Effects)
    .map(Element => <Element.menu.Effects key={Element.menu.id} />)
}

const Actions = ({ hasFilters, filtersOpen, onToggleFilters }) => {
  const chart = useChart()
  const moreRef = useRef()
  const settingsTabs = useAttributeValue("settingsTabs") || []
  const [moreMenu, setMoreMenu] = useAttribute("moreMenu")
  const [tabIndex, setTabIndex] = useState(null)
  const [returnTo, setReturnTo] = useState(null)

  const menuOpen = !!moreMenu
  const stack = moreMenu?.drill || rootDrill

  useEffect(() => {
    if (!menuOpen) setReturnTo(null)
  }, [menuOpen])

  const openMenu = () => setMoreMenu({ drill: [] })
  const closeMenu = () => setMoreMenu(null)
  const closeTab = () => setTabIndex(null)
  const openTab = index => {
    closeMenu()
    setTabIndex(index)
  }
  const drillIn = id => {
    setReturnTo(null)
    setMoreMenu({ drill: [...stack, id] })
  }
  const back = () => {
    setReturnTo(stack.at(-1) ?? null)
    setMoreMenu({ drill: stack.slice(0, -1) })
  }

  const tabOpen = tabIndex !== null
  const menuProps = {
    chart,
    onClose: closeMenu,
    onOpenTab: openTab,
    hasFilters,
    filtersOpen,
    onToggleFilters,
  }

  return (
    <Toolbar data-noprint data-testid="chartHeaderToolbox" flex={false}>
      <MenuEffects />
      <PinnedActions menuProps={menuProps} />
      <Button
        ref={moreRef}
        icon={<Icon svg={moreIcon} width="16px" height="16px" />}
        title="More"
        active={menuOpen}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => (menuOpen ? closeMenu() : openMenu())}
        data-testid="chartHeaderToolbox-more"
        data-track={chart.track("more")}
      />
      {moreRef.current && menuOpen && (
        <Drop
          target={moreRef.current}
          onEsc={stack.length ? back : closeMenu}
          onClickOutside={closeMenu}
          data-toolbox={chart.getId()}
          {...dropProps}
          stretch={false}
        >
          <MoreMenu
            {...menuProps}
            drill={stack}
            returnTo={returnTo}
            onDrill={drillIn}
            onBack={back}
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
