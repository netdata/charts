import React, { Fragment } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
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
    basis="0"
    data-testid="chartHeaderToolbox"
    alignSelf="end"
    {...props}
  />
)

const Toolbox = props => {
  const disabled = !useAttributeValue("focused")
  const toolboxElements = useAttributeValue("toolboxElements")

  return (
    <Container {...props}>
      {toolboxElements.map((Element, index, arr) => (
        <Fragment key={index}>
          <Element disabled={disabled} />
          {arr[index + 1] ? <Separator disabled={disabled} /> : null}
        </Fragment>
      ))}
    </Container>
  )
}

export { Container, Separator, ChartType, Fullscreen, Information }

export default Toolbox
