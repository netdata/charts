import React, { useRef, useState } from "react"
import { Drop, Flex } from "@netdata/netdata-ui"
import moreIcon from "@netdata/netdata-ui/dist/components/icon/assets/more.svg"
import rearrange from "@netdata/netdata-ui/dist/components/icon/assets/rearrange.svg"
import Icon, { Button } from "@/components/icon"
import { useAttributeValue, useChart } from "@/components/provider"
import Fullscreen from "@/components/toolbox/fullscreen"
import SettingsContent from "@/components/toolbox/settings/content"
import { dropProps } from "@/components/modern/menu"
import TileMenu from "./menu"

export const DragHandle = () => {
  const toolboxProps = useAttributeValue("toolboxProps")
  const drag = toolboxProps?.drag

  if (!drag) return null

  const { dragging, ...handleProps } = drag

  return (
    <Button
      icon={<Icon svg={rearrange} width="14px" height="14px" />}
      title="Move tile"
      data-testid="modernTile-drag"
      cursor={dragging ? "grabbing" : "grab"}
      {...handleProps}
    />
  )
}

const TileActions = ({ hasFilters, onOpenChange }) => {
  const chart = useChart()
  const moreRef = useRef()
  const toolboxElements = useAttributeValue("toolboxElements") || []
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const update = (nextMenu, nextSettings) => {
    setMenuOpen(nextMenu)
    setSettingsOpen(nextSettings)
    onOpenChange?.(nextMenu || nextSettings)
  }

  const closeMenu = () => update(false, settingsOpen)
  const closeSettings = () => update(menuOpen, false)
  const openSettings = () => update(false, true)

  return (
    <Flex alignItems="center" gap={0.5} data-noprint data-testid="modernTile-actions">
      <DragHandle />
      {toolboxElements.includes(Fullscreen) && <Fullscreen />}
      <Button
        ref={moreRef}
        icon={<Icon svg={moreIcon} width="16px" height="16px" />}
        title="More"
        active={menuOpen}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => update(!menuOpen, false)}
        data-testid="modernTile-more"
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
          <TileMenu hasFilters={hasFilters} onClose={closeMenu} onOpenSettings={openSettings} />
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
    </Flex>
  )
}

export default TileActions
