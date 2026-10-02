import React, { useMemo, useState } from "react"
import styled from "styled-components"
import { Box, Flex, TextMicro, getColor } from "@netdata/netdata-ui"
import {
  useAttribute,
  useAttributeValue,
  useChart,
  useDimensionIds,
  useVisibleDimensionIds,
} from "@/components/provider"
import makeLog from "@/sdk/makeLog"
import { radius } from "@/components/modern/tokens"
import { Swatch, onToggle } from "@/components/modern/legend/parts"
import { showAllDimensions, useHiddenDimensionsCount } from "./hiddenDimensions"

export const navigationModes = [
  { value: "pan", label: "Pan", title: "Drag to pan", track: "pan" },
  {
    value: "select",
    label: "Select",
    title: "Drag to zoom (Shift+drag)",
    track: "selectHorizontal",
  },
  {
    value: "highlight",
    label: "Highlight",
    title: "Drag to highlight (Alt+drag)",
    track: "highlight",
  },
  {
    value: "selectVertical",
    label: "Vertical",
    title: "Drag to zoom vertically (Alt+Shift+drag)",
    track: "selectVertical",
  },
]

export const dimensionSorts = [
  { value: "default", label: "Default" },
  { value: "nameAsc", label: "Name A→Z" },
  { value: "nameDesc", label: "Name Z→A" },
  { value: "valueAsc", label: "Value Min→Max" },
  { value: "valueDesc", label: "Value Max→Min" },
  { value: "anomalyAsc", label: "Anomaly Min→Max" },
  { value: "anomalyDesc", label: "Anomaly Max→Min" },
]

const tabLabels = {
  display: "Chart type and display…",
  data: "Data and aggregation…",
  info: "Chart details…",
  download: "Download…",
}

const Panel = styled(Flex).attrs({ column: true, padding: [1], width: "260px" })`
  font-size: 12.5px;
`

const Row = styled(Flex).attrs({
  as: "button",
  alignItems: "center",
  justifyContent: "between",
  gap: 4,
  width: "100%",
  round: 1,
  padding: [1, 2],
  cursor: "pointer",
})`
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  text-align: left;
  color: ${getColor("text")};

  &:hover:not(:disabled) {
    background: ${getColor("mainChartTboxHover")};
  }

  &:disabled {
    cursor: default;
    color: ${getColor("textLite")};
  }
`

const Check = styled(Box).attrs({ as: "span", width: 4 })`
  display: inline-block;
  color: ${getColor("primary")};
`

const Content = styled(Flex).attrs({ as: "span", alignItems: "center", overflow: "hidden" })`
  color: inherit;
  min-width: 0;
`

const Hint = styled(Box).attrs({ as: "span" })`
  flex-shrink: 0;
  color: ${getColor("textLite")};
  white-space: nowrap;
`

const Divider = styled(Box).attrs({ margin: [1, 0], background: "borderSecondary" })`
  height: 1px;
`

const Segment = styled(Box).attrs(({ isActive }) => ({
  as: "button",
  border: { side: "all", color: isActive ? "text" : "border" },
  padding: [1, 0],
  cursor: "pointer",
}))`
  flex: 1;
  border-radius: ${radius.control};
  background: ${({ isActive, theme }) =>
    isActive ? getColor("borderSecondary")({ theme }) : "transparent"};
  font-family: inherit;
  font-size: 11.5px;
  color: ${getColor("text")};
`

const SearchInput = styled(Box).attrs({
  as: "input",
  width: "100%",
  border: true,
  padding: [1, 2],
})`
  border-radius: ${radius.control};
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  color: ${getColor("text")};
`

const DimensionName = styled(Box).attrs({ as: "span", overflow: "hidden" })`
  margin-left: 6px;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Label = ({ children }) => (
  <TextMicro color="textLite" padding={[2, 2.5, 0.5]}>
    {children}
  </TextMicro>
)

const Item = ({ children, hint, check, ...rest }) => (
  <Row type="button" role="menuitem" {...rest}>
    <Content>
      {check !== undefined && <Check>{check ? "✓" : ""}</Check>}
      {children}
    </Content>
    {!!hint && <Hint>{hint}</Hint>}
  </Row>
)

const NavigationModes = ({ log }) => {
  const chart = useChart()
  const [navigation, setNavigation] = useAttribute("navigation")

  return (
    <Flex gap={1} padding={[0.5, 2.5, 1.5]} role="group" aria-label="Navigation">
      {navigationModes.map(({ value, label, title, track }) => (
        <Segment
          key={value}
          type="button"
          title={title}
          isActive={navigation === value}
          aria-pressed={navigation === value}
          data-testid={`chartMore-navigation-${value}`}
          data-track={chart.track(track)}
          onClick={() => {
            setNavigation(value)
            log({ chartAction: `chart-toolbox-${value}` })
          }}
        >
          {label}
        </Segment>
      ))}
    </Flex>
  )
}

const DimensionSorts = ({ onChange }) => {
  const chart = useChart()
  const [open, setOpen] = useState(false)
  const value = useAttributeValue("dimensionsSort")
  const current = dimensionSorts.find(sort => sort.value === value) || dimensionSorts[0]

  return (
    <>
      <Item
        hint={current.label}
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
        data-testid="chartMore-sort"
      >
        Sort dimensions
      </Item>
      {open &&
        dimensionSorts.map(sort => (
          <Item
            key={sort.value}
            check={sort.value === current.value}
            onClick={() => onChange(sort.value)}
            data-testid={`chartMore-sort-${sort.value}`}
            data-track={chart.track(sort.value)}
          >
            {sort.label}
          </Item>
        ))}
    </>
  )
}

export const dimensionsLimit = 50
const searchThreshold = 10

const Dimensions = () => {
  const chart = useChart()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const dimensionIds = useDimensionIds() || []
  const visibleIds = useVisibleDimensionIds() || []
  const hidden = useHiddenDimensionsCount()

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return dimensionIds
    return dimensionIds.filter(id =>
      `${chart.getDimensionName(id) || id}`.toLowerCase().includes(query)
    )
  }, [chart, dimensionIds, search])

  if (!dimensionIds.length) return null

  const shown = matches.slice(0, dimensionsLimit)
  const more = matches.length - shown.length

  return (
    <>
      <Item
        hint={hidden ? `${visibleIds.length} of ${dimensionIds.length} shown` : "All shown"}
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
        data-testid="chartMore-dimensions"
      >
        Dimensions
      </Item>
      {open && (
        <>
          <Item
            disabled={!hidden}
            data-testid="chartMore-dimensions-showAll"
            data-track={chart.track("showAllDimensions")}
            onClick={() => showAllDimensions(chart)}
          >
            Show all
          </Item>
          {dimensionIds.length > searchThreshold && (
            <Flex padding={[0.5, 2.5]}>
              <SearchInput
                type="search"
                value={search}
                placeholder="Search dimensions"
                aria-label="Search dimensions"
                data-testid="chartMore-dimensions-search"
                onChange={event => setSearch(event.target.value)}
              />
            </Flex>
          )}
          <Flex column overflow={{ vertical: "auto" }} height={{ max: "240px" }}>
            {shown.map(id => (
              <Item
                key={id}
                check={chart.isDimensionVisible(id)}
                title={chart.getDimensionName(id) || id}
                aria-checked={chart.isDimensionVisible(id)}
                role="menuitemcheckbox"
                data-testid="chartMore-dimension"
                data-dimension={id}
                data-track={chart.track("toggleDimension")}
                onClick={onToggle(chart, id)}
              >
                <Swatch swatchColor={chart.selectDimensionColor(id)} />
                <DimensionName>{chart.getDimensionName(id) || id}</DimensionName>
              </Item>
            ))}
          </Flex>
          {more > 0 && (
            <TextMicro color="textLite" padding={[1, 2.5]} data-testid="chartMore-dimensions-more">
              {`${more} more, refine the search`}
            </TextMicro>
          )}
        </>
      )}
    </>
  )
}

const MoreMenu = ({ onClose, onOpenTab }) => {
  const chart = useChart()
  const log = makeLog(chart)
  const after = useAttributeValue("after")
  const liveAfter = useAttributeValue("liveAfter")
  const enabledResetRange = useAttributeValue("enabledResetRange")
  const [showAnomalies, setShowAnomalies] = useAttribute("showAnomalies")
  const [showAnnotations, setShowAnnotations] = useAttribute("showAnnotations")
  const [showingInfo, setShowingInfo] = useAttribute("showingInfo")
  const settingsTabs = useAttributeValue("settingsTabs") || []

  const toggleLayer = (setValue, value) => {
    setValue(!value)
    chart.getUI()?.invalidateRender?.()
    chart.trigger("render")
  }

  return (
    <Panel role="menu" data-testid="chartMoreMenu">
      <Label>Navigation</Label>
      <NavigationModes log={log} />
      <Item
        hint="Shift+wheel"
        data-testid="chartMore-zoomIn"
        data-track={chart.track("zoomIn")}
        onClick={() => {
          chart.zoomIn()
          log({ chartAction: "chart-toolbox-zoom-in" })
        }}
      >
        Zoom in
      </Item>
      <Item
        data-testid="chartMore-zoomOut"
        data-track={chart.track("zoomOut")}
        onClick={() => {
          chart.zoomOut()
          log({ chartAction: "chart-toolbox-zoom-out" })
        }}
      >
        Zoom out
      </Item>
      {enabledResetRange && (
        <Item
          hint="Alt+Shift+R"
          disabled={after === liveAfter}
          data-testid="chartMore-zoomReset"
          data-track={chart.track("zoomReset")}
          onClick={() => {
            chart.resetNavigation()
            log({ chartAction: "chart-toolbox-reset-zoom" })
            onClose()
          }}
        >
          Reset zoom
        </Item>
      )}
      <Divider />
      <Item
        check={!!showAnomalies}
        data-testid="chartMore-anomalies"
        onClick={() => toggleLayer(setShowAnomalies, showAnomalies)}
      >
        Anomaly rate
      </Item>
      <Item
        check={!!showAnnotations}
        data-testid="chartMore-annotations"
        onClick={() => toggleLayer(setShowAnnotations, showAnnotations)}
      >
        Annotations
      </Item>
      <DimensionSorts onChange={value => chart.updateAttribute("dimensionsSort", value)} />
      <Dimensions />
      <Divider />
      {settingsTabs.map((tab, index) => (
        <Item
          key={tab.id || index}
          data-testid={`chartMore-tab-${tab.id || index}`}
          data-track={chart.track(`settings-${tab.id || index}`)}
          onClick={() => onOpenTab(index)}
        >
          {tabLabels[tab.id] || `${tab.label}…`}
        </Item>
      ))}
      <Item
        check={!!showingInfo}
        data-testid="chartMore-info"
        data-track={chart.track("information")}
        onClick={() => {
          setShowingInfo(!showingInfo)
          onClose()
        }}
      >
        Chart info
      </Item>
      <Item
        data-testid="chartMore-reload"
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

export default MoreMenu
