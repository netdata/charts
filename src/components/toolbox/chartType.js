import React, { memo, useMemo } from "react"
import { Menu } from "@netdata/netdata-ui"
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
import Icon, { Button } from "@/components/icon"
import { useChart, useAttributeValue } from "@/components/provider"

const iconProps = { color: "textLite", margin: [0, 2, 0, 0], size: "14px" }

const useItems = chart =>
  useMemo(
    () =>
      [
        {
          justDesc: true,
          label: "Timeseries",
        },
        {
          value: "line",
          label: "Line",
          icon: <Icon svg={lineChart} {...iconProps} />,
          svg: lineChart,
          "data-track": chart.track("chartType-line"),
        },
        {
          value: "stacked",
          label: "Stacked",
          icon: <Icon svg={stackedChart} {...iconProps} />,
          svg: stackedChart,
          "data-track": chart.track("chartType-stacked"),
        },
        {
          value: "area",
          label: "Area",
          icon: <Icon svg={areaChart} {...iconProps} />,
          svg: areaChart,
          "data-track": chart.track("chartType-area"),
        },
        {
          value: "stackedBar",
          label: "Stacked Bar",
          icon: <Icon svg={stackedBarChart} {...iconProps} />,
          svg: stackedBarChart,
          "data-track": chart.track("chartType-stackedBar"),
        },
        {
          value: "multiBar",
          label: "Multi Column",
          icon: <Icon svg={barChart} {...iconProps} />,
          svg: barChart,
          "data-track": chart.track("chartType-multiBar"),
        },
        // {
        //   value: "table",
        //   label: "Table",
        //   icon: <Icon svg={tableChart} {...iconProps} />,
        //   svg: tableChart,
        //   "data-track": chart.track("chartType-tableBar"),
        // },
        {
          value: "heatmap",
          label: "Heatmap",
          icon: <Icon svg={heatmapChart} {...iconProps} />,
          svg: heatmapChart,
          "data-track": chart.track("chartType-heatmap"),
          disabled: chart.getHeatmapType() === "disabled",
        },
        {
          justDesc: true,
          label: "Graphs",
        },
        "bars" in chart.sdk.ui && {
          value: "bars",
          label: "Bar",
          icon: <Icon svg={barsChart} {...iconProps} />,
          svg: barsChart,
          "data-track": chart.track("chartType-bars"),
        },
        "easypiechart" in chart.sdk.ui && {
          value: "easypiechart",
          label: "Circle",
          icon: <Icon svg={easypieChart} {...iconProps} />,
          svg: easypieChart,
          "data-track": chart.track("chartType-pie"),
        },
        "gauge" in chart.sdk.ui && {
          value: "gauge",
          label: "Gauge",
          icon: <Icon svg={gaugeChart} {...iconProps} />,
          svg: gaugeChart,
          "data-track": chart.track("chartType-gauge"),
        },
        "d3pie" in chart.sdk.ui && {
          value: "d3pie",
          label: "Pie",
          icon: <Icon svg={d3pieChart} {...iconProps} />,
          svg: d3pieChart,
          "data-track": chart.track("chartType-d3pie"),
        },
        "number" in chart.sdk.ui && {
          value: "number",
          label: "Value",
          icon: <Icon svg={valueChart} {...iconProps} />,
          svg: valueChart,
          "data-track": chart.track("chartType-value"),
        },
        "groupBoxes" in chart.sdk.ui && {
          value: "groupBoxes",
          label: "Group boxes",
          icon: <Icon svg={groupBoxesChart} {...iconProps} />,
          svg: groupBoxesChart,
          "data-track": chart.track("chartType-groupBoxes"),
        },
      ].filter(Boolean),
    [chart, chart.getHeatmapType()]
  )

const ChartType = ({ disabled }) => {
  const chart = useChart()
  const chartLibrary = useAttributeValue("chartLibrary") || "dygraph"
  const chartType = useAttributeValue("chartType") || "line"
  const value = chartLibrary === "dygraph" ? chartType : chartLibrary

  const items = useItems(chart)
  const { label, svg } = items.find(({ value: v }) => v === value)

  return (
    <Menu
      value={value}
      items={items}
      dropProps={{ align: { top: "bottom", right: "right" }, "data-toolbox": chart.getId() }}
      dropdownProps={{ width: "130px" }}
      onChange={chart.updateChartTypeAttribute}
      data-track={chart.track("chartType")}
    >
      <Button
        icon={<Icon svg={svg} size="16px" />}
        title={label}
        disabled={disabled}
        data-testid="chartHeaderToolbox-chartType"
      />
    </Menu>
  )
}

export default memo(ChartType)
