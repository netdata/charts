import React from "react"
import information from "@netdata/netdata-ui/lib/components/icon/assets/information.svg"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import Icon from "@/components/icon"
import { useChart, useAttributeValue, useTitle } from "@/components/provider"
import Row from "./row"

const ChartDescription = () => {
  const title = useTitle()
  const info = useAttributeValue("info")
  const sectionInfo = useAttributeValue("sectionInfo")

  const chart = useChart()

  const onClick = event => {
    const { hash = "" } = event.target

    if (!hash.startsWith("#menu")) return

    event.preventDefault()
    chart.sdk.trigger("goToLink", chart, hash.substr(1))
  }

  return (
    <Row
      icon={<Icon svg={information} color="key" />}
      title={title}
      color="key"
      data-testid="cartDetails-description"
    >
      <TextSmall
        color="textDescription"
        dangerouslySetInnerHTML={{ __html: sectionInfo }}
        onClick={onClick}
      />
      <TextSmall
        color="textDescription"
        dangerouslySetInnerHTML={{ __html: info }}
        onClick={onClick}
      />
    </Row>
  )
}

export default ChartDescription
