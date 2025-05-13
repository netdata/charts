import React from "react"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import Separator from "@/components/line/separator"
import ChartType from "./chartType"
import Fullscreen from "./fullscreen"
import Information from "./information"
import Download from "./download"

const Container = props => (
  <Flex
    gap={1}
    justifyContent="end"
    alignItems="center"
    flex
    data-testid="chartHeaderToolbox"
    zIndex={5}
    {...props}
  />
)

const Toolbox = ({ children, ...rest }) => {
  const disabled = !useAttributeValue("focused")
  const toolboxElements = useAttributeValue("toolboxElements")

  return (
    <Container data-noprint {...rest}>
      {children}
      {toolboxElements.map((Element, index) => (
        <Element key={index} disabled={disabled} />
      ))}
    </Container>
  )
}

export { Container, Separator, ChartType, Fullscreen, Information, Download }

export default Toolbox
