import React from "react"
import information from "@netdata/netdata-ui/lib/components/icon/assets/information.svg"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import Icon from "@/components/icon"
import { useAttributeValue, useChart, useTitle } from "@/components/provider"
import Row from "./row"

const DescriptionText = ({ children }) => {
  const chart = useChart()

  const click = event => {
    const { hash = "" } = event.target

    if (!hash.startsWith("#menu")) return

    event.preventDefault()
    chart.sdk.trigger("goToLink", hash.substr(1))
  }

  return (
    <TextSmall
      color="textDescription"
      dangerouslySetInnerHTML={{ __html: children }}
      onClick={click}
    />
  )
}

const Description = () => {
  const title = useTitle()
  const description = useAttributeValue("description")

  return (
    <Row
      icon={<Icon svg={information} color="key" />}
      title={title}
      data-testid="cartDetails-information"
    >
      {description && <DescriptionText>{description}</DescriptionText>}
    </Row>
  )
}

export default Description
