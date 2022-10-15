import React from "react"
import information from "@netdata/netdata-ui/lib/components/icon/assets/information.svg"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import Icon from "@/components/icon"
import { useAttributeValue, useTitle } from "@/components/provider"
import Row from "./row"

const ChartDescription = () => {
  const title = useTitle()
  const info = useAttributeValue("info")
  const sectionInfo = useAttributeValue("sectionInfo")

  return (
    <Row
      icon={<Icon svg={information} color="key" />}
      title={title}
      color="key"
      data-testid="cartDetails-description"
    >
      <TextSmall color="textDescription" dangerouslySetInnerHTML={{ __html: sectionInfo }} />
      <TextSmall color="textDescription" dangerouslySetInnerHTML={{ __html: info }} />
    </Row>
  )
}

export default ChartDescription
