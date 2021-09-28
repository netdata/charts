import React, { memo } from "react"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import lineChart from "@netdata/netdata-ui/lib/components/icon/assets/line_chart2.svg"
import stackedChart from "@netdata/netdata-ui/lib/components/icon/assets/stacked_chart.svg"
import areaChart from "@netdata/netdata-ui/lib/components/icon/assets/area_chart.svg"
import Icon, { Button } from "@/components/icon"
import { useMetadata, useAttribute } from "@/components/provider"

const iconProps = { color: "border", margin: [0, 2, 0, 0] }

const items = [
  {
    value: "line",
    label: "Line",
    icon: <Icon svg={lineChart} {...iconProps} />,
    svg: lineChart,
    "data-track": "chartType-line",
  },
  {
    value: "stacked",
    label: "Stacked",
    icon: <Icon svg={stackedChart} {...iconProps} />,
    svg: stackedChart,
    "data-track": "chartType-stacked",
  },
  {
    value: "area",
    label: "Area",
    icon: <Icon svg={areaChart} {...iconProps} />,
    svg: areaChart,
    "data-track": "chartType-area",
  },
]

const ChartType = ({ disabled }) => {
  const { chartType: metaChartType } = useMetadata()
  const [chartTypeAttribute, setChartType] = useAttribute("chartType")
  const chartType = chartTypeAttribute || metaChartType

  const onChange = value => setChartType(metaChartType === value ? "" : value)

  const { label, svg } = items.find(({ value }) => value === chartType)

  return (
    <Menu
      value={chartType}
      items={items}
      dropProps={{ align: { top: "bottom", right: "right" }, "data-toolbox": true }}
      onChange={onChange}
      data-track="chartType"
    >
      <Button
        icon={<Icon svg={svg} />}
        title={label}
        disabled={disabled}
        data-testid="chartHeaderToolbox-chartType"
      />
    </Menu>
  )
}

export default memo(ChartType)
