import React from "react"
import metrics from "@netdata/netdata-ui/lib/components/icon/assets/metrics.svg"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import Icon from "@/components/icon"
import { useChart } from "@/components/provider"
import Row from "./row"

const ChartType = () => {
  const chart = useChart()
  const { chartType } = chart.getMetadata()

  return (
    <Row
      icon={<Icon svg={metrics} color="key" />}
      title="Chart type"
      color="key"
      data-testid="cartDetails-chartType"
    >
      <TextSmall color="textDescription">{chartType}</TextSmall>
    </Row>
  )
}

export default ChartType
