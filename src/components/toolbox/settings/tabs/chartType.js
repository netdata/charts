import React, { memo, useMemo } from "react"
import { Flex, TextSmall, Select } from "@netdata/netdata-ui"
import lineChart from "@netdata/netdata-ui/dist/components/icon/assets/line_chart2.svg"
import stackedChart from "@netdata/netdata-ui/dist/components/icon/assets/stacked_chart.svg"
import areaChart from "@netdata/netdata-ui/dist/components/icon/assets/area_chart.svg"
import barChart from "@netdata/netdata-ui/dist/components/icon/assets/bar_chart.svg"
import stackedBarChart from "@netdata/netdata-ui/dist/components/icon/assets/stacked_bar_chart.svg"
import heatmapChart from "@netdata/netdata-ui/dist/components/icon/assets/heatmap_chart.svg"
import barsChart from "@netdata/netdata-ui/dist/components/icon/assets/chart_bars.svg"
import easypieChart from "@netdata/netdata-ui/dist/components/icon/assets/chart_circle.svg"
import gaugeChart from "@netdata/netdata-ui/dist/components/icon/assets/chart_gauge.svg"
import d3pieChart from "@netdata/netdata-ui/dist/components/icon/assets/chart_pie.svg"
import valueChart from "@netdata/netdata-ui/dist/components/icon/assets/value.svg"
import tableChart from "@netdata/netdata-ui/dist/components/icon/assets/chart_bars.svg"
import groupBoxesChart from "@netdata/netdata-ui/dist/components/icon/assets/container.svg"
import Icon from "@/components/icon"
import { useChart, useAttributeValue } from "@/components/provider"

const useOptions = chart =>
  useMemo(
    () =>
      [
        {
          value: "line",
          label: "Line",
          svg: lineChart,
          group: "timeseries",
          "data-track": chart.track("chartType-line"),
        },
        {
          value: "stacked",
          label: "Stacked",
          svg: stackedChart,
          group: "timeseries",
          "data-track": chart.track("chartType-stacked"),
        },
        {
          value: "area",
          label: "Area",
          svg: areaChart,
          group: "timeseries",
          "data-track": chart.track("chartType-area"),
        },
        {
          value: "stackedBar",
          label: "Stacked Bar",
          svg: stackedBarChart,
          group: "timeseries",
          "data-track": chart.track("chartType-stackedBar"),
        },
        {
          value: "multiBar",
          label: "Multi Column",
          svg: barChart,
          group: "timeseries",
          "data-track": chart.track("chartType-multiBar"),
        },
        {
          value: "table",
          label: "Table",
          svg: tableChart,
          group: "timeseries",
          "data-track": chart.track("chartType-tableChart"),
        },
        {
          value: "heatmap",
          label: "Heatmap",
          svg: heatmapChart,
          group: "timeseries",
          "data-track": chart.track("chartType-heatmap"),
          isDisabled: chart.getHeatmapType() === "disabled",
        },
        "bars" in chart.sdk.ui && {
          value: "bars",
          label: "Bar",
          svg: barsChart,
          group: "graphs",
          "data-track": chart.track("chartType-bars"),
        },
        "easypiechart" in chart.sdk.ui && {
          value: "easypiechart",
          label: "Circle",
          svg: easypieChart,
          group: "graphs",
          "data-track": chart.track("chartType-pie"),
        },
        "gauge" in chart.sdk.ui && {
          value: "gauge",
          label: "Gauge",
          svg: gaugeChart,
          group: "graphs",
          "data-track": chart.track("chartType-gauge"),
        },
        "d3pie" in chart.sdk.ui && {
          value: "d3pie",
          label: "Pie",
          svg: d3pieChart,
          group: "graphs",
          "data-track": chart.track("chartType-d3pie"),
        },
        "number" in chart.sdk.ui && {
          value: "number",
          label: "Value",
          svg: valueChart,
          group: "graphs",
          "data-track": chart.track("chartType-value"),
        },
        "groupBoxes" in chart.sdk.ui && {
          value: "groupBoxes",
          label: "Group boxes",
          svg: groupBoxesChart,
          group: "graphs",
          "data-track": chart.track("chartType-groupBoxes"),
        },
      ].filter(Boolean),
    [chart, chart.getHeatmapType()]
  )

const groupedOptions = options => [
  { label: "Timeseries", options: options.filter(o => o.group === "timeseries") },
  { label: "Graphs", options: options.filter(o => o.group === "graphs") },
]

const formatOptionLabel = option => (
  <Flex alignItems="center" gap={1}>
    {option.svg && <Icon svg={option.svg} size="14px" color="textLite" />}
    <TextSmall>{option.label}</TextSmall>
  </Flex>
)

const selectStyles = {
  option: (styles, state) => ({
    ...styles,
    opacity: state.isDisabled ? 0.4 : 1,
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    pointerEvents: state.isDisabled ? "none" : "auto",
  }),
}

const ChartType = () => {
  const chart = useChart()
  const chartLibrary = useAttributeValue("chartLibrary") || "dygraph"
  const chartType = useAttributeValue("chartType") || "line"
  const value = chart.isTimeSeriesRenderer(chartLibrary) ? chartType : chartLibrary

  const options = useOptions(chart)
  const grouped = useMemo(() => groupedOptions(options), [options])
  const current = options.find(o => o.value === value) || options[0]

  const handleChange = option => {
    if (!option) return
    chart.updateChartTypeAttribute(option.value)
  }

  return (
    <Flex column gap={2}>
      <TextSmall color="textNoFocus" strong>
        Chart type
      </TextSmall>
      <Select
        value={current}
        options={grouped}
        onChange={handleChange}
        formatOptionLabel={formatOptionLabel}
        styles={selectStyles}
        data-testid="chartSettings-chartType"
      />
    </Flex>
  )
}

export default memo(ChartType)
