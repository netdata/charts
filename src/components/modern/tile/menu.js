import React from "react"
import { TextMicro } from "@netdata/netdata-ui"
import { useAttribute, useAttributeValue, useChart } from "@/components/provider"
import FilterToolbox from "@/components/filterToolbox"
import Settings from "@/components/toolbox/settings"
import Fullscreen from "@/components/toolbox/fullscreen"
import { Divider, Item, MenuElements, Panel } from "@/components/modern/menu"

export const getConsumerElements = (toolboxElements = []) =>
  toolboxElements.filter(Element => Element !== Settings && Element !== Fullscreen)

const TileMenu = ({ hasFilters, onClose, onOpenSettings }) => {
  const chart = useChart()
  const focused = useAttributeValue("focused")
  const toolboxElements = useAttributeValue("toolboxElements")
  const settingsTabs = useAttributeValue("settingsTabs") || []
  const [showingInfo, setShowingInfo] = useAttribute("showingInfo")
  const elements = getConsumerElements(toolboxElements)

  return (
    <Panel width="280px" role="menu" data-testid="modernTileMenu">
      <MenuElements elements={elements} focused={focused} data-testid="modernTileMenu-elements" />
      {hasFilters && (
        <>
          <TextMicro color="textLite" padding={[1, 2.5, 0.5]}>
            Filters
          </TextMicro>
          <FilterToolbox column alignItems="start" border="none" padding={[0, 1]} />
          <Divider />
        </>
      )}
      {settingsTabs.length > 0 && (
        <Item
          data-testid="modernTileMenu-settings"
          data-track={chart.track("settings")}
          onClick={onOpenSettings}
        >
          Chart settings…
        </Item>
      )}
      <Item
        check={!!showingInfo}
        contentGap={1}
        data-testid="modernTileMenu-info"
        data-track={chart.track("information")}
        onClick={() => {
          setShowingInfo(!showingInfo)
          onClose()
        }}
      >
        Chart info
      </Item>
      <Item
        data-testid="modernTileMenu-reload"
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

export default TileMenu
