import React from "react"
import { useAttributeValue } from "@/components/provider"
import Row from "./row"
import Info from "./info"

const Context = () => {
  const contextScope = useAttributeValue("contextScope")

  return (
    <Row title="Plugin and chart context" color="key" data-testid="chartDetails-context">
      <Info title="Context">{contextScope.join(", ")}</Info>
    </Row>
  )
}

export default Context
