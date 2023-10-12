import React from "react"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import Separator from "@/components/line/separator"
import ChartType from "./chartType"
import Fullscreen from "./fullscreen"
import Information from "./information"

const Container = props => (
  <Flex
    gap={1}
    justifyContent="end"
    alignItem="center"
    flex
    data-testid="chartHeaderToolbox"
    {...props}
  />
)

const Toolbox = props => {
  const disabled = !useAttributeValue("focused")
  const toolboxElements = useAttributeValue("toolboxElements")

  return (
    <Container {...props}>
      {toolboxElements.map((Element, index) => (
        <Element key={index} disabled={disabled} />
      ))}
    </Container>
  )
}

export { Container, Separator, ChartType, Fullscreen, Information }

export default Toolbox
