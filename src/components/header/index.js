import React, { Fragment } from "react"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import Toolbox from "@/components/toolbox"
import Separator from "@/components/line/separator"
import { Title } from "@/components/title"

export const Container = props => (
  <Flex
    alignItems="center"
    justifyContent="start"
    padding={[1, 2]}
    gap={0.5}
    border={{ side: "bottom", color: "borderSecondary" }}
    data-testid="chartHeader"
    height="25px"
    background="mainChartHeaderBg"
    {...props}
  />
)

const Header = () => {
  const leftHeaderElements = useAttributeValue("leftHeaderElements")

  return (
    <Container>
      {leftHeaderElements.map((Element, index, arr) => (
        <Fragment key={index}>
          <Element />
          {arr[index + 1] ? <Separator /> : null}
        </Fragment>
      ))}
      <Title />
      <Toolbox />
    </Container>
  )
}

export default Header
