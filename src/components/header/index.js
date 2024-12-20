import React, { Fragment } from "react"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue, useIsMinimal } from "@/components/provider"
import Toolbox from "@/components/toolbox"
import FilterToolbox from "@/components/filterToolbox"
import Separator from "@/components/line/separator"
import { Title } from "@/components/title"

export const Container = props => {
  const isMinimal = useIsMinimal()

  return (
    <Flex
      alignItems="center"
      justifyContent="start"
      padding={[1, 2]}
      gap={0.5}
      data-testid="chartHeader"
      height="25px"
      {...(!isMinimal && {
        background: "mainChartHeaderBg",
        border: { side: "bottom", color: "borderSecondary" },
      })}
      {...props}
    />
  )
}

const Header = ({ hasFilters }) => {
  const isMinimal = useIsMinimal()
  const leftHeaderElements = useAttributeValue("leftHeaderElements")
  const focused = useAttributeValue("focused")

  return (
    <Container>
      {leftHeaderElements.map((Element, index, arr) => (
        <Fragment key={index}>
          <Element />
          {arr[index + 1] ? <Separator /> : null}
        </Fragment>
      ))}
      <Title />
      {isMinimal && hasFilters && <FilterToolbox opacity={focused ? 1 : 0.7} />}
      <Toolbox />
    </Container>
  )
}

export default Header
