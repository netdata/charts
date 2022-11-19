import React, { memo, useMemo } from "react"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import lineChart from "@netdata/netdata-ui/lib/components/icon/assets/line_chart2.svg"
import stackedChart from "@netdata/netdata-ui/lib/components/icon/assets/stacked_chart.svg"
import areaChart from "@netdata/netdata-ui/lib/components/icon/assets/area_chart.svg"
import Icon, { Button } from "@/components/icon"
import { useChart, useAttribute } from "@/components/provider"

const iconProps = { color: "border", margin: [0, 2, 0, 0], size: "16px" }

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
      // {
      //   value: "stackedBar",
      //   label: "Stacked Bar",
      //   icon: <Icon svg={areaChart} {...iconProps} />,
      //   svg: areaChart,
      //   "data-track": chart.track("chartType-stackedBar"),
      // },
      // {
      //   value: "multibar",
      //   label: "Multi Bar",
      //   icon: <Icon svg={areaChart} {...iconProps} />,
      //   svg: areaChart,
      //   "data-track": chart.track("chartType-multibar"),
      // },
      // {
      //   value: "heatmap",
      //   label: "Heatmap",
      //   icon: <Icon svg={areaChart} {...iconProps} />,
      //   svg: areaChart,
      //   "data-track": chart.track("chartType-heatmap"),
      // },
    ],
    [chart]
  )

const ChartType = ({ disabled }) => {
  const chart = useChart()
  const [chartTypeAttribute, setChartType] = useAttribute("chartType")
  const chartType = chartTypeAttribute || "line"

  const items = useItems(chart)
  const { label, svg } = items.find(({ value }) => value === chartType)

  return (
    <Menu
      value={chartType}
      items={items}
      dropProps={{ align: { top: "bottom", right: "right" }, "data-toolbox": true }}
      onChange={setChartType}
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
