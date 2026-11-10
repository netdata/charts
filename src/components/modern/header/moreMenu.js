import React, { useEffect, useMemo, useState } from "react"
import styled from "styled-components"
import { Box, Flex, TextMicro, getColor } from "@netdata/netdata-ui"
import {
  useAttribute,
  useAttributeValue,
  useChart,
  useDimensionIds,
  useVisibleDimensionIds,
} from "@/components/provider"
import filterIcon from "@netdata/netdata-ui/dist/components/icon/assets/filter.svg"
import zoomResetIcon from "@netdata/netdata-ui/dist/components/icon/assets/zoom_reset.svg"
import Information from "@/components/toolbox/information"
import { useIsHeatmap } from "@/helpers/heatmap"
import { useLegendMode } from "@/components/modern/legend/mode"
import makeLog from "@/sdk/makeLog"
import { radius } from "@/components/modern/tokens"
import { onToggle } from "@/components/modern/legend/parts"
import { LineSwatch } from "@/components/modern/swatch"
import { Divider, Item, MenuScroll, Panel, useMenuNavigation } from "@/components/modern/menu"
import { focusMenuItem } from "@/components/modern/focus"
import NavigationModes from "@/components/modern/navigationModes"
import { showAllDimensions, useHiddenDimensionsCount } from "./hiddenDimensions"

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

const SearchInput = styled(Box).attrs({
  as: "input",
  width: "100%",
  border: true,
  round: radius.control,
  padding: [1, 2],
})`
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  color: ${getColor("text")};
`

const DimensionName = styled(Box).attrs({ as: "span", margin: [0, 0, 0, 1.5], overflow: "hidden" })`
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const rootGroupId = "root"

const groupDrillPrefix = "group:"

export const menuGroups = [
  { id: "navigate", label: "Navigate" },
  { id: "show", label: "Show" },
  { id: "data", label: "Data" },
  { id: "actions", label: "Actions" },
]

const tabPlacement = {
  data: { group: "data", order: 40 },
  display: { group: "data", order: 50 },
  download: { group: "actions", order: 900 },
  info: { group: "actions", order: 910 },
}

const sortableLegendModes = { below: true, table: true }

export const useCanSortDimensions = () => {
  const dimensionIds = useDimensionIds() || []
  const isHeatmap = useIsHeatmap()
  const legendMode = useLegendMode()
  const chartLibrary = useAttributeValue("chartLibrary")

  return (
    dimensionIds.length > 1 &&
    !isHeatmap &&
    (!!sortableLegendModes[legendMode] || chartLibrary === "bars")
  )
}

const toggleLayer = (chart, setValue, value) => {
  setValue(!value)
  chart.getUI()?.invalidateRender?.()
  chart.trigger("render")
}

const SortPanel = ({ onBack }) => {
  const chart = useChart()
  const value = useAttributeValue("dimensionsSort")
  const current = dimensionSorts.find(sort => sort.value === value) || dimensionSorts[0]

  return dimensionSorts.map(sort => (
    <Item
      key={sort.value}
      role="menuitemradio"
      check={sort.value === current.value}
      aria-checked={sort.value === current.value}
      onClick={() => {
        chart.updateAttribute("dimensionsSort", sort.value)
        onBack()
      }}
      data-testid={`chartMore-sort-${sort.value}`}
      data-track={chart.track(sort.value)}
    >
      {sort.label}
    </Item>
  ))
}

export const dimensionsLimit = 50
const searchThreshold = 10

const DimensionsPanel = () => {
  const chart = useChart()
  const [search, setSearch] = useState("")
  const dimensionIds = useDimensionIds() || []
  const hidden = useHiddenDimensionsCount()

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return dimensionIds
    return dimensionIds.filter(id =>
      `${chart.getDimensionName(id) || id}`.toLowerCase().includes(query)
    )
  }, [chart, dimensionIds, search])

  const shown = matches.slice(0, dimensionsLimit)
  const more = matches.length - shown.length

  return (
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
      <MenuScroll height={{ max: "240px" }}>
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
            <LineSwatch swatchColor={chart.selectDimensionColor(id)} />
            <DimensionName>{chart.getDimensionName(id) || id}</DimensionName>
          </Item>
        ))}
      </MenuScroll>
      {more > 0 && (
        <TextMicro color="textLite" padding={[1, 2.5]} data-testid="chartMore-dimensions-more">
          {`${more} more, refine the search`}
        </TextMicro>
      )}
    </>
  )
}

const builtInItems = [
  { id: "navigation", group: rootGroupId, order: 0, Component: NavigationModes },
  {
    id: "zoomIn",
    group: "navigate",
    order: 10,
    useItem: ({ chart }) => ({
      label: "Zoom in",
      hint: "Shift+wheel",
      testId: "chartMore-zoomIn",
      track: "zoomIn",
      onClick: () => {
        chart.zoomIn()
        makeLog(chart)({ chartAction: "chart-toolbox-zoom-in" })
      },
    }),
  },
  {
    id: "zoomOut",
    group: "navigate",
    order: 20,
    useItem: ({ chart }) => ({
      label: "Zoom out",
      testId: "chartMore-zoomOut",
      track: "zoomOut",
      onClick: () => {
        chart.zoomOut()
        makeLog(chart)({ chartAction: "chart-toolbox-zoom-out" })
      },
    }),
  },
  {
    id: "zoomReset",
    group: "navigate",
    order: 30,
    pin: { icon: zoomResetIcon, testId: "chartHeaderToolbox-zoomReset", order: 30 },
    useItem: ({ chart, onClose }) => {
      const after = useAttributeValue("after")
      const liveAfter = useAttributeValue("liveAfter")
      const enabledResetRange = useAttributeValue("enabledResetRange")

      if (!enabledResetRange) return null

      return {
        label: "Reset zoom",
        hint: "Alt+Shift+R",
        disabled: after === liveAfter,
        testId: "chartMore-zoomReset",
        track: "zoomReset",
        onClick: () => {
          chart.resetNavigation()
          makeLog(chart)({ chartAction: "chart-toolbox-reset-zoom" })
          onClose()
        },
      }
    },
  },
  {
    id: "anomalies",
    group: "show",
    order: 10,
    useItem: ({ chart }) => {
      const [showAnomalies, setShowAnomalies] = useAttribute("showAnomalies")

      return {
        label: "Anomaly rate",
        check: !!showAnomalies,
        testId: "chartMore-anomalies",
        onClick: () => toggleLayer(chart, setShowAnomalies, showAnomalies),
      }
    },
  },
  {
    id: "annotations",
    group: "show",
    order: 20,
    useItem: ({ chart }) => {
      const [showAnnotations, setShowAnnotations] = useAttribute("showAnnotations")

      return {
        label: "Annotations",
        check: !!showAnnotations,
        testId: "chartMore-annotations",
        onClick: () => toggleLayer(chart, setShowAnnotations, showAnnotations),
      }
    },
  },
  Information.menu,
  focusMenuItem,
  {
    id: "filters",
    group: "data",
    order: 10,
    pin: { icon: filterIcon, testId: "chartHeaderToolbox-filters", order: 20 },
    useItem: ({ hasFilters, filtersOpen, onToggleFilters, onClose }) =>
      hasFilters
        ? {
            label: filtersOpen ? "Hide filters" : "Show filters",
            check: !!filtersOpen,
            testId: "chartMore-filters",
            track: "filters",
            onClick: () => {
              onToggleFilters()
              onClose()
            },
          }
        : null,
  },
  {
    id: "dimensions",
    group: rootGroupId,
    order: 900,
    useItem: () => {
      const dimensionIds = useDimensionIds() || []
      const visibleIds = useVisibleDimensionIds() || []
      const hidden = useHiddenDimensionsCount()

      if (!dimensionIds.length) return null

      return {
        label: "Dimensions",
        hint: hidden ? `${visibleIds.length} of ${dimensionIds.length} shown` : "All shown",
        testId: "chartMore-dimensions",
        Panel: DimensionsPanel,
      }
    },
  },
  {
    id: "sort",
    group: "data",
    order: 30,
    useItem: () => {
      const value = useAttributeValue("dimensionsSort")
      const canSort = useCanSortDimensions()
      const current = dimensionSorts.find(sort => sort.value === value) || dimensionSorts[0]

      if (!canSort) return null

      return {
        label: "Sort dimensions",
        hint: current.label,
        testId: "chartMore-sort",
        Panel: SortPanel,
      }
    },
  },
  {
    id: "reload",
    group: "actions",
    order: 1000,
    useItem: ({ chart, onClose }) => ({
      label: "Reload data",
      testId: "chartMore-reload",
      track: "refresh",
      onClick: () => {
        chart.fetch()
        onClose()
      },
    }),
  },
]

const makeTabItems = settingsTabs =>
  settingsTabs.map((tab, index) => {
    const key = tab.id || index
    const placement = tabPlacement[tab.id] || { group: "actions", order: 920 + index }

    return {
      id: `tab-${key}`,
      ...placement,
      useItem: ({ onOpenTab }) => ({
        label: tabLabels[tab.id] || `${tab.label}…`,
        testId: `chartMore-tab-${key}`,
        track: `settings-${key}`,
        onClick: () => onOpenTab(index),
      }),
    }
  })

export const getConsumerMenuItems = (toolboxElements = []) =>
  toolboxElements.filter(Element => !!Element?.menu).map(Element => Element.menu)

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0)

export const useMenuItems = () => {
  const toolboxElements = useAttributeValue("toolboxElements")
  const settingsTabs = useAttributeValue("settingsTabs") || []

  return useMemo(() => {
    const builtIn = [...builtInItems, ...makeTabItems(settingsTabs)]
    const ids = new Set(builtIn.map(item => item.id))
    const consumer = getConsumerMenuItems(toolboxElements).filter(item => !ids.has(item.id))

    return [...builtIn, ...consumer]
  }, [toolboxElements, settingsTabs])
}

const MenuRow = ({ descriptor, menuProps, onDrill }) => {
  const item = descriptor.useItem(menuProps)

  if (!item || item.hidden) return null

  const {
    label,
    icon,
    hint,
    check,
    selectionStyle,
    disabled,
    onClick,
    Panel: ItemPanel,
    testId,
    track,
  } = item

  return (
    <Item
      icon={icon}
      hint={hint}
      check={check}
      selectionStyle={selectionStyle}
      disabled={disabled}
      drill={!!ItemPanel}
      aria-haspopup={ItemPanel ? "menu" : undefined}
      data-menu-id={descriptor.id}
      data-testid={testId}
      data-track={track ? menuProps.chart.track(track) : undefined}
      onClick={ItemPanel ? () => onDrill(descriptor.id) : onClick}
    >
      {label}
    </Item>
  )
}

const DrilledPanel = ({ descriptor, menuProps, onBack }) => {
  const item = descriptor.useItem(menuProps)
  const ItemPanel = !item || item.hidden ? null : item.Panel

  useEffect(() => {
    if (!ItemPanel) onBack()
  }, [ItemPanel])

  if (!ItemPanel) return null

  return (
    <Flex column width={item.panelWidth || "260px"} data-testid="chartMore-drilled">
      <Item data-testid="chartMore-back" onClick={onBack}>
        {`← ${item.label}`}
      </Item>
      <Divider />
      <ItemPanel onBack={onBack} onClose={menuProps.onClose} />
    </Flex>
  )
}

const MenuEntries = ({ descriptors, menuProps, onDrill }) =>
  descriptors.map(descriptor =>
    descriptor.Component ? (
      <descriptor.Component key={descriptor.id} />
    ) : (
      <MenuRow
        key={descriptor.id}
        descriptor={descriptor}
        menuProps={menuProps}
        onDrill={onDrill}
      />
    )
  )

const GroupPanel = ({ group, descriptors, menuProps, onDrill, onBack }) => (
  <Flex column width="260px" data-testid="chartMore-drilled">
    <Item data-testid="chartMore-back" onClick={onBack}>
      {`← ${group.label}`}
    </Item>
    <Divider />
    <MenuEntries descriptors={descriptors} menuProps={menuProps} onDrill={onDrill} />
  </Flex>
)

const GroupRow = ({ group, onDrill }) => (
  <Item
    drill
    aria-haspopup="menu"
    data-menu-id={`${groupDrillPrefix}${group.id}`}
    data-testid={`chartMore-group-${group.id}`}
    onClick={() => onDrill(`${groupDrillPrefix}${group.id}`)}
  >
    {group.label}
  </Item>
)

const getGroupItems = (items, id) =>
  items.filter(item => item.group === id && !item.pin).sort(byOrder)

const MoreMenu = ({
  onClose,
  onOpenTab,
  drill = [],
  returnTo = null,
  onDrill,
  onBack,
  hasFilters = false,
  filtersOpen = false,
  onToggleFilters,
}) => {
  const chart = useChart()
  const items = useMenuItems()
  const current = drill[drill.length - 1] ?? null
  const { ref, onKeyDown } = useMenuNavigation(
    `${drill.join(">")}|${returnTo}`,
    returnTo ? `[data-menu-id="${returnTo}"]` : null
  )

  const menuProps = { chart, onClose, onOpenTab, hasFilters, filtersOpen, onToggleFilters }
  const drilledGroup =
    current?.startsWith(groupDrillPrefix) &&
    menuGroups.find(({ id }) => `${groupDrillPrefix}${id}` === current)
  const drilled = current && !drilledGroup && items.find(item => item.id === current)

  return (
    <Panel
      ref={ref}
      role="menu"
      data-testid="chartMoreMenu"
      onKeyDown={onKeyDown}
      {...(current && { width: "auto" })}
    >
      {drilledGroup && (
        <GroupPanel
          key={drilledGroup.id}
          group={drilledGroup}
          descriptors={getGroupItems(items, drilledGroup.id)}
          menuProps={menuProps}
          onDrill={onDrill}
          onBack={onBack}
        />
      )}
      {drilled && (
        <DrilledPanel key={drilled.id} descriptor={drilled} menuProps={menuProps} onBack={onBack} />
      )}
      {!current && (
        <MenuScroll height={{ max: "360px" }} data-testid="chartMoreRoot">
          <MenuEntries
            descriptors={getGroupItems(items, rootGroupId)}
            menuProps={menuProps}
            onDrill={onDrill}
          />
          {menuGroups
            .filter(({ id }) => getGroupItems(items, id).length > 0)
            .map(group => (
              <GroupRow key={group.id} group={group} onDrill={onDrill} />
            ))}
        </MenuScroll>
      )}
    </Panel>
  )
}

export default MoreMenu
