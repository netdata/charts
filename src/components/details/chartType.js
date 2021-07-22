import React from "react"
import metrics from "@netdata/netdata-ui/lib/components/icon/assets/metrics.svg"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import Icon from "@/components/icon"
import { useMetadata } from "@/components/provider"
import Row from "./row"

const ChartType = () => {
  const { chartType } = useMetadata()

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
