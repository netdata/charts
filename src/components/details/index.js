import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextSmall, Text } from "@netdata/netdata-ui/lib/components/typography"
import information from "@netdata/netdata-ui/lib/components/icon/assets/information.svg"
// import database from "@netdata/netdata-ui/lib/components/icon/assets/database.svg"
import plugins from "@netdata/netdata-ui/lib/components/icon/assets/plugins.svg"
import metrics from "@netdata/netdata-ui/lib/components/icon/assets/metrics.svg"
import Icon from "@/components/icon"
import styled from "styled-components"

const Row = ({ icon, title, children, ...rest }) => {
  return (
    <Flex gap={4} {...rest}>
      {icon}
      <Flex column gap={1}>
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
    <TextSmall>{title}</TextSmall>
    <Flex as={TextSmall} background="elementBackground">
      {children}
    </Flex>
  </Flex>
)

const Container = styled(Flex)`
  position: absolute;
  inset: 0;
`

const Details = ({ chart }) => {
  const { title, chartType, plugin, context } = chart.getMetadata()

  return (
    <Container
      column
      padding={[4, 3]}
      gap={5}
      background="mainBackground"
      data-testid="cartDetails"
    >
      <Row
        icon={<Icon svg={information} color="key" />}
        title={title}
        data-testid="cartDetails-information"
      ></Row>
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
        <TextSmall>{chartType}</TextSmall>
      </Row>
    </Container>
  )
}

export default Details
