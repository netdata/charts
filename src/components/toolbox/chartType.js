import React, { memo, useMemo } from "react"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import lineChart from "@netdata/netdata-ui/lib/components/icon/assets/line_chart2.svg"
import stackedChart from "@netdata/netdata-ui/lib/components/icon/assets/stacked_chart.svg"
import areaChart from "@netdata/netdata-ui/lib/components/icon/assets/area_chart.svg"
import barChart from "@netdata/netdata-ui/lib/components/icon/assets/bar_chart.svg"
import stackedBarChart from "@netdata/netdata-ui/lib/components/icon/assets/stacked_bar_chart.svg"
import heatmapChart from "@netdata/netdata-ui/lib/components/icon/assets/heatmap_chart.svg"
import Icon, { Button } from "@/components/icon"
import { useChart, useAttributeValue } from "@/components/provider"

const iconProps = { color: "text", margin: [0, 2, 0, 0], size: "16px" }

const useItems = chart =>
  useMemo(
    () => [
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
        label: "Multi Bar",
        icon: <Icon svg={barChart} {...iconProps} />,
        svg: barChart,
        "data-track": chart.track("chartType-multiBar"),
      },
      {
        value: "heatmap",
        label: "Heatmap",
        icon: <Icon svg={heatmapChart} {...iconProps} />,
        svg: heatmapChart,
        "data-track": chart.track("chartType-heatmap"),
        disabled: chart.getHeatmapType() === "disabled",
      },
    ],
    [chart, chart.getHeatmapType()]
  )

const ChartType = ({ disabled }) => {
  const chart = useChart()
  const chartType = useAttributeValue("chartType") || "line"

  const items = useItems(chart)
  const { label, svg } = items.find(({ value }) => value === chartType)

  return (
    <Menu
      value={chartType}
      items={items}
      dropProps={{ align: { top: "bottom", right: "right" }, "data-toolbox": true }}
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
