import React from "react"
import metrics from "@netdata/netdata-ui/dist/components/icon/assets/metrics.svg"
import { TextSmall } from "@netdata/netdata-ui"
import Icon from "@/components/icon"
import { useAttributeValue } from "@/components/provider"
import Row from "./row"

const ChartType = () => {
  const chartType = useAttributeValue("chartType")

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
