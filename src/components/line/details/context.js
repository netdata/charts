import React from "react"
import plugins from "@netdata/netdata-ui/lib/components/icon/assets/plugins.svg"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Icon from "@/components/icon"
import { useMetadata } from "@/components/provider"
import Row from "./row"

const Info = ({ title, children }) => (
  <Flex gap={2}>
    <TextSmall color="textDescription">{title}</TextSmall>
    <Flex as={TextSmall} background="elementBackground">
      {children}
    </Flex>
  </Flex>
)

const Context = () => {
  const { chartLabels, context } = useMetadata()
  const plugin = chartLabels?._collect_plugin?.[0]

  return (
    <Row
      icon={<Icon svg={plugins} color="key" />}
      title="Plugin and chart context"
      color="key"
      data-testid="cartDetails-context"
    >
      <Info title="Plugin">{plugin}</Info>
      <Info title="Context">{context}</Info>
    </Row>
  )
}

export default Context
