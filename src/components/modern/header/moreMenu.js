import React, { useState } from "react"
import styled from "styled-components"
import { Flex, TextMicro, getColor } from "@netdata/netdata-ui"
import { useAttribute, useAttributeValue, useChart } from "@/components/provider"
import makeLog from "@/sdk/makeLog"
import { radius } from "@/components/modern/tokens"

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

  &:hover:not(:disabled) {
    background: ${getColor("mainChartTboxHover")};
  }

  &:disabled {
    cursor: default;
    color: ${getColor("textLite")};
  }
`

const Check = styled.span`
  display: inline-block;
  width: 16px;
  color: ${getColor("primary")};
`

const Hint = styled.span`
  color: ${getColor("textLite")};
  white-space: nowrap;
`

const Divider = styled.div`
  height: 1px;
  margin: 4px 0;
  background: ${getColor("borderSecondary")};
`

const Segment = styled.button`
  flex: 1;
  border: 1px solid ${({ $active, theme }) => getColor($active ? "text" : "border")({ theme })};
  border-radius: ${radius.control};
  padding: 4px 0;
  background: ${({ $active, theme }) =>
    $active ? getColor("borderSecondary")({ theme }) : "transparent"};
  font-family: inherit;
  font-size: 11.5px;
  cursor: pointer;
  color: ${getColor("text")};
`

const Label = ({ children }) => (
  <TextMicro color="textLite" padding={[2, 2.5, 0.5]}>
    {children}
  </TextMicro>
)

const Item = ({ children, hint, check, ...rest }) => (
  <Row type="button" role="menuitem" {...rest}>
    <span>
      {check !== undefined && <Check>{check ? "✓" : ""}</Check>}
      {children}
    </span>
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
          $active={navigation === value}
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

const MoreMenu = ({ onClose, onOpenTab }) => {
  const chart = useChart()
  const log = makeLog(chart)
  const after = useAttributeValue("after")
  const enabledResetRange = useAttributeValue("enabledResetRange")
  const [showAnomalies, setShowAnomalies] = useAttribute("showAnomalies")
  const [showAnnotations, setShowAnnotations] = useAttribute("showAnnotations")
  const [showingInfo, setShowingInfo] = useAttribute("showingInfo")
  const settingsTabs = useAttributeValue("settingsTabs") || []

  // uPlot plotters read these on draw; the render is skipped unless the UI is marked stale.
  // dygraph only reads them on mount, so there the change applies on the next remount.
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
          disabled={after === -900}
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
      <Divider />
      {settingsTabs.map(tab => (
        <Item
          key={tab.id}
          data-testid={`chartMore-tab-${tab.id}`}
          data-track={chart.track(`settings-${tab.id}`)}
          onClick={() => onOpenTab(tab.id)}
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
