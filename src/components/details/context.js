import React from "react"
import { TextSmall, Flex } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
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
  const contextScope = useAttributeValue("contextScope")

  return (
    <Row title="Plugin and chart context" color="key" data-testid="chartDetails-context">
      <Info title="Context">{contextScope.join(", ")}</Info>
    </Row>
  )
}

export default Context
