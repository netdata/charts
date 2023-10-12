import React from "react"
import database from "@netdata/netdata-ui/dist/components/icon/assets/database.svg"
import { TextSmall } from "@netdata/netdata-ui"
import Icon from "@/components/icon"
import { useAttributeValue } from "@/components/provider"
import Row from "./row"

const Source = () => {
  const nodeName = useAttributeValue("nodeName")

  return (
    <Row
      icon={<Icon svg={database} color="key" />}
      title="Source"
      color="key"
      data-testid="cartDetails-source"
    >
      <TextSmall color="textDescription">{nodeName}</TextSmall>
    </Row>
  )
}

export default Source
