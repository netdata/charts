import { useMemo } from "react"
import { Flex, TextMicro } from "@netdata/netdata-ui"
import { useAttribute, useAttributeValue, useChart } from "@/components/provider"
import { useChartTypeOptions } from "@/components/toolbox/settings/tabs/chartType"
import TimeAggregation from "@/components/toolbox/settings/tabs/timeAggregation"
import ValueRange from "@/components/toolbox/settings/valueRange"
import NumberFormat from "@/components/toolbox/settings/numberFormat"
import GaugeThresholds from "@/components/toolbox/settings/gaugeThresholds"
import PointsToFetch from "@/components/toolbox/settings/pointsToFetch"
import {
  liveReason,
  lockedReason,
  useLegendLayoutChoices,
} from "@/components/toolbox/settings/legendLayout"
import { resetSettings, useIsPristine } from "@/components/toolbox/settings/reset"
import { useDownloadItems } from "@/components/toolbox/download/useDownload"
import { Item, MenuHeading, MenuScroll } from "@/components/modern/menu"
import Icon from "@/components/icon"

const useHasTab = id => {
  const settingsTabs = useAttributeValue("settingsTabs") || []
  return settingsTabs.some(tab => tab.id === id)
}

const FormPanel = ({ children }) => (
  <Flex column gap={3} padding={[1, 2.5, 2]}>
    {children}
  </Flex>
)

const updateDisplay = (chart, changes) => {
  chart.updateAttributes(changes)
  chart.trigger("yAxisChange")
}

const useChartType = () => {
  const chart = useChart()
  const chartLibrary = useAttributeValue("chartLibrary") || "dygraph"
  const chartType = useAttributeValue("chartType") || "line"
  const options = useChartTypeOptions(chart)
  const value = chart.isTimeSeriesRenderer(chartLibrary) ? chartType : chartLibrary

  return { options, current: options.find(option => option.value === value) || options[0] }
}

const chartTypeGroups = [
  { id: "timeseries", label: "Timeseries" },
  { id: "graphs", label: "Graphs" },
]

const ChartTypePanel = ({ onBack }) => {
  const chart = useChart()
  const { options, current } = useChartType()

  return (
    <MenuScroll height={{ max: "320px" }}>
      {chartTypeGroups.map(group => (
        <Flex column key={group.id}>
          <MenuHeading>{group.label}</MenuHeading>
          {options
            .filter(option => option.group === group.id)
            .map(option => (
              <Item
                key={option.value}
                role="menuitemradio"
                icon={option.svg && <Icon svg={option.svg} size="14px" color="textLite" />}
                check={option.value === current?.value}
                disabled={option.isDisabled}
                data-testid={`chartMore-chartType-${option.value}`}
                data-track={option["data-track"]}
                onClick={() => {
                  chart.updateChartTypeAttribute(option.value)
                  onBack()
                }}
              >
                {option.label}
              </Item>
            ))}
        </Flex>
      ))}
    </MenuScroll>
  )
}

const YAxisPanel = () => {
  const chart = useChart()
  const enabledYAxis = useAttributeValue("enabledYAxis")

  return (
    <>
      <Item
        check={!!enabledYAxis}
        data-testid="chartMore-yAxis-visible"
        onClick={() => updateDisplay(chart, { enabledYAxis: !enabledYAxis })}
      >
        Show Y axis
      </Item>
      <FormPanel>
        <ValueRange />
      </FormPanel>
    </>
  )
}

const LegendPanel = ({ onBack }) => {
  const chart = useChart()
  const legend = useAttributeValue("legend")
  const { chartOptions, locked, selected, value, setChartLegendLayout } = useLegendLayoutChoices()

  const pick = option => {
    updateDisplay(chart, { legend: true })
    if (!locked) setChartLegendLayout(option.value === "auto" ? null : option.value)
    onBack()
  }

  return (
    <>
      <Item
        role="menuitemradio"
        check={!legend}
        data-testid="chartMore-legend-hidden"
        onClick={() => {
          updateDisplay(chart, { legend: false })
          onBack()
        }}
      >
        Hidden
      </Item>
      {chartOptions.map(option => (
        <Item
          key={option.value}
          role="menuitemradio"
          check={!!legend && option.value === selected}
          disabled={option.isDisabled || (locked && option.value !== selected)}
          title={option.isDisabled ? liveReason : undefined}
          data-testid={`chartMore-legend-${option.value}`}
          onClick={() => pick(option)}
        >
          {option.label}
        </Item>
      ))}
      {locked && (
        <TextMicro color="textLite" padding={[1, 2.5]} data-testid="chartMore-legend-locked">
          {lockedReason(value.label)}
        </TextMicro>
      )}
    </>
  )
}

const ThresholdsPanel = () => (
  <FormPanel>
    <GaugeThresholds />
  </FormPanel>
)

const UnitsPanel = () => (
  <FormPanel>
    <NumberFormat />
  </FormPanel>
)

const PointsPanel = () => (
  <FormPanel>
    <PointsToFetch />
  </FormPanel>
)

const TimeAggregationPanel = () => (
  <FormPanel>
    <TimeAggregation />
  </FormPanel>
)

const downloadKeys = {
  "Download as CSV": "csv",
  "Download raw data": "raw",
  "Download as PDF": "pdf",
  "Download as PNG": "png",
}

const DownloadPanel = ({ onClose }) => {
  const chart = useChart()
  const items = useDownloadItems(chart)

  return items.map(item => (
    <Item
      key={item.label}
      data-testid={`chartMore-download-${downloadKeys[item.label]}`}
      data-track={item["data-track"]}
      onClick={() => {
        item.onClick()
        onClose()
      }}
    >
      {item.label.replace(/^Download /, "")}
    </Item>
  ))
}

const formatRange = range => {
  const [min, max] = range || []
  if (min == null && max == null) return "Auto"
  return `${min ?? "auto"} – ${max ?? "auto"}`
}

const useResetKeys = () => {
  const settingsTabs = useAttributeValue("settingsTabs") || []
  return useMemo(
    () => [...new Set(settingsTabs.flatMap(tab => tab.resetKeys || []))],
    [settingsTabs]
  )
}

export const builtInTabIds = ["display", "data", "info", "download"]

export const settingsItems = [
  {
    id: "chartType",
    group: "root",
    order: 100,
    useItem: () => {
      const hasDisplay = useHasTab("display")
      const { current } = useChartType()

      if (!hasDisplay) return null

      return {
        label: "Chart type",
        hint: current?.label,
        testId: "chartMore-chartType",
        track: "chartType",
        Panel: ChartTypePanel,
      }
    },
  },
  {
    id: "xAxis",
    group: "show",
    order: 50,
    useItem: ({ chart }) => {
      const hasDisplay = useHasTab("display")
      const enabledXAxis = useAttributeValue("enabledXAxis")

      if (!hasDisplay) return null

      return {
        label: "X axis",
        check: !!enabledXAxis,
        testId: "chartMore-xAxis",
        onClick: () => updateDisplay(chart, { enabledXAxis: !enabledXAxis }),
      }
    },
  },
  {
    id: "yAxis",
    group: "show",
    order: 60,
    useItem: () => {
      const hasDisplay = useHasTab("display")
      const enabledYAxis = useAttributeValue("enabledYAxis")
      const staticValueRange = useAttributeValue("staticValueRange")

      if (!hasDisplay) return null

      return {
        label: "Y axis",
        hint: enabledYAxis ? formatRange(staticValueRange) : "Hidden",
        testId: "chartMore-yAxis",
        Panel: YAxisPanel,
      }
    },
  },
  {
    id: "legend",
    group: "show",
    order: 70,
    useItem: () => {
      const hasDisplay = useHasTab("display")
      const legend = useAttributeValue("legend")
      const { value } = useLegendLayoutChoices()

      if (!hasDisplay) return null

      return {
        label: "Legend",
        hint: legend ? value.label : "Hidden",
        testId: "chartMore-legend",
        Panel: LegendPanel,
      }
    },
  },
  {
    id: "units",
    group: "show",
    order: 80,
    useItem: () => {
      const hasDisplay = useHasTab("display")
      const desiredUnits = useAttributeValue("desiredUnits") || ["auto"]
      const staticFractionDigits = useAttributeValue("staticFractionDigits")

      if (!hasDisplay) return null

      const isAuto = desiredUnits.every(unit => unit === "auto") && staticFractionDigits == null

      return {
        label: "Units and decimals",
        hint: isAuto ? "Auto" : "Custom",
        testId: "chartMore-units",
        Panel: UnitsPanel,
        panelWidth: "280px",
      }
    },
  },
  {
    id: "thresholds",
    group: "show",
    order: 90,
    useItem: () => {
      const hasDisplay = useHasTab("display")
      const chartLibrary = useAttributeValue("chartLibrary")
      const thresholds = useAttributeValue("gaugeThresholds") || []

      if (!hasDisplay || chartLibrary !== "gauge") return null

      return {
        label: "Thresholds",
        hint: thresholds.length ? `${thresholds.length}` : undefined,
        testId: "chartMore-thresholds",
        Panel: ThresholdsPanel,
        panelWidth: "320px",
      }
    },
  },
  {
    id: "timeAggregation",
    group: "data",
    order: 35,
    useItem: ({ hasFilters }) => {
      const hasData = useHasTab("data")

      if (!hasData || hasFilters) return null

      return {
        label: "Time aggregation",
        testId: "chartMore-timeAggregation",
        track: "groupingMethod",
        Panel: TimeAggregationPanel,
      }
    },
  },
  {
    id: "nulls2zero",
    group: "data",
    order: 40,
    useItem: ({ chart }) => {
      const hasData = useHasTab("data")
      const [nulls2zero, setNulls2zero] = useAttribute("nulls2zero")

      if (!hasData) return null

      return {
        label: "Treat gaps as zero",
        check: !!nulls2zero,
        testId: "chartMore-nulls2zero",
        onClick: () => {
          setNulls2zero(!nulls2zero)
          chart.trigger("fetch", { processing: true })
        },
      }
    },
  },
  {
    id: "points",
    group: "data",
    order: 50,
    useItem: () => {
      const hasData = useHasTab("data")
      const points = useAttributeValue("points")

      if (!hasData) return null

      return {
        label: "Data points",
        hint: points ?? "Auto",
        testId: "chartMore-points",
        Panel: PointsPanel,
      }
    },
  },
  {
    id: "download",
    group: "actions",
    order: 900,
    useItem: () => {
      const hasDownload = useHasTab("download")

      if (!hasDownload) return null

      return {
        label: "Download",
        testId: "chartMore-download",
        track: "download-chart",
        Panel: DownloadPanel,
      }
    },
  },
  {
    id: "resetSettings",
    group: "actions",
    order: 950,
    useItem: ({ chart, onClose }) => {
      const resetKeys = useResetKeys()
      const pristine = useIsPristine(resetKeys)

      if (!resetKeys.length) return null

      return {
        label: "Reset chart settings",
        disabled: pristine,
        testId: "chartMore-resetSettings",
        track: "resetSettings",
        onClick: () => {
          resetSettings(chart, resetKeys)
          onClose()
        },
      }
    },
  },
]
