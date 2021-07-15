import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextSmall, Text } from "@netdata/netdata-ui/lib/components/typography"
import information from "@netdata/netdata-ui/lib/components/icon/assets/information.svg"
import database from "@netdata/netdata-ui/lib/components/icon/assets/database.svg"
import plugins from "@netdata/netdata-ui/lib/components/icon/assets/plugins.svg"
import metrics from "@netdata/netdata-ui/lib/components/icon/assets/metrics.svg"
import Icon from "@/components/icon"
import { useChart, useAttributeValue } from "@/components/provider"

const Row = ({ icon, title, children, ...rest }) => {
  return (
    <Flex gap={4} {...rest}>
      {icon}
      <Flex column gap={1} flex="grow" basis={0}>
        <Text strong color="key">
          {title}
        </Text>
        {children && (
          <Flex column gap={1}>
            {children}
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

const Plugin = ({ title, children }) => (
  <Flex gap={2}>
    <TextSmall color="textDescription">{title}</TextSmall>
    <Flex as={TextSmall} background="elementBackground">
      {children}
    </Flex>
  </Flex>
)

const Description = ({ children }) => {
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

const Container = styled(Flex).attrs({
  column: true,
  padding: [4, 3],
  gap: 5,
  background: "mainBackground",
  overflow: { vertical: "auto" },
})`
  position: absolute;
  inset: 0;
`

const Details = () => {
  const chart = useChart()
  const description = useAttributeValue("description")
  const nodeName = useAttributeValue("nodeName")
  const { title, chartType, plugin, context } = chart.getMetadata()

  return (
    <Container data-testid="cartDetails">
      <Row
        icon={<Icon svg={information} color="key" />}
        title={title}
        data-testid="cartDetails-information"
      >
        {description && <Description>{description}</Description>}
      </Row>
      {nodeName && (
        <Row
          icon={<Icon svg={database} color="key" />}
          title="Source"
          color="key"
          data-testid="cartDetails-source"
        >
          <TextSmall color="textDescription">{nodeName}</TextSmall>
        </Row>
      )}
      <Row
        icon={<Icon svg={plugins} color="key" />}
        title="Plugin and chart context"
        color="key"
        data-testid="cartDetails-context"
      >
        <Plugin title="Plugin">{plugin}</Plugin>
        <Plugin title="Context">{context}</Plugin>
      </Row>
      <Row
        icon={<Icon svg={metrics} color="key" />}
        title="Chart type"
        color="key"
        data-testid="cartDetails-chartType"
      >
        <TextSmall color="textDescription">{chartType}</TextSmall>
      </Row>
    </Container>
  )
}

export default Details
