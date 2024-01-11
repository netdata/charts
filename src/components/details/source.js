import React from "react"
import { TextSmall } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import Row from "./row"

const Source = () => {
  const nodeName = useAttributeValue("nodeName")

  return (
    <Row title="Source" color="key" data-testid="chartDetails-source">
      <TextSmall color="textDescription">{nodeName}</TextSmall>
    </Row>
  )
}

export default Source
