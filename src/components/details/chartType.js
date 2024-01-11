import React from "react"
import { TextSmall } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import Row from "./row"

const ChartType = () => {
  const chartType = useAttributeValue("chartType")

  return (
    <Row title="Chart type" color="key" data-testid="chartDetails-chartType">
      <TextSmall color="textDescription">{chartType}</TextSmall>
    </Row>
  )
}

export default ChartType
