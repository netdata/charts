import React from "react"
import styled from "styled-components"
import { Flex, TextMicro, getColor } from "@netdata/netdata-ui"
import { useAttribute, useAttributeValue, useChart } from "@/components/provider"
import FilterToolbox from "@/components/filterToolbox"
import Settings from "@/components/toolbox/settings"
import Fullscreen from "@/components/toolbox/fullscreen"
import { TileMenuContext } from "./context"

export const getConsumerElements = (toolboxElements = []) =>
  toolboxElements.filter(Element => Element !== Settings && Element !== Fullscreen)

const Panel = styled(Flex).attrs({ column: true, padding: [1], width: "280px" })`
  font-size: 12.5px;
`

const Row = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
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
  width: 16px;
  color: ${getColor("primary")};
`

const Divider = styled.div`
  height: 1px;
  margin: 4px 0;
  background: ${getColor("borderSecondary")};
`

const Item = ({ children, check, ...rest }) => (
  <Row type="button" role="menuitem" {...rest}>
    {check !== undefined && <Check>{check ? "✓" : ""}</Check>}
    <span>{children}</span>
  </Row>
)

const TileMenu = ({ hasFilters, onClose, onOpenSettings }) => {
  const chart = useChart()
  const focused = useAttributeValue("focused")
  const toolboxElements = useAttributeValue("toolboxElements")
  const settingsTabs = useAttributeValue("settingsTabs") || []
  const [showingInfo, setShowingInfo] = useAttribute("showingInfo")
  const elements = getConsumerElements(toolboxElements)

  return (
    <Panel role="menu" data-testid="modernTileMenu">
      {elements.length > 0 && (
        <Flex
          alignItems="center"
          gap={1}
          padding={[0.5, 1.5, 1.5]}
          border={{ side: "bottom", color: "borderSecondary" }}
          margin={[0, 0, 1]}
          flexWrap
          data-testid="modernTileMenu-elements"
        >
          <TileMenuContext.Provider value>
            {elements.map((Element, index) => (
              <Element key={index} disabled={!focused} />
            ))}
          </TileMenuContext.Provider>
        </Flex>
      )}
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
