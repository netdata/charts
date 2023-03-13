import React from "react"
import styled, { keyframes } from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import useHover from "@/components/useHover"
import withChart from "@/components/hocs/withChart"
import { useChart, useAttributeValue, useLoadingColor } from "@/components/provider"
import ChartContainer from "@/components/chartContainer"
import FilterToolbox from "@/components/line/filterToolbox"
import Container from "@/components/line/container"
import Details from "@/components/line//details"
import GroupBoxes from "./groupBoxes"
import Footer from "./footer"

const frames = keyframes`
  from { opacity: 0.2; }
  to { opacity: 0.6; }
`

const Skeleton = styled(Flex).attrs(props => ({
  background: "borderSecondary",
  flex: true,
  height: 50,
  ...props,
}))`
  animation: ${frames} 1.6s ease-in infinite;
`

export const SkeletonIcon = () => {
  const color = useLoadingColor()
  return <Skeleton background={color} />
}

export const GroupBoxesContainer = props => {
  const chart = useChart()

  const ref = useHover(
    {
      onHover: chart.focus,
      onBlur: chart.blur,
      isOut: node =>
        !node || (!node.closest("[data-toolbox]") && !node.closest("[data-testid=chart]")),
    },
    [chart]
  )

  const loaded = useAttributeValue("loaded")
  const detailed = useAttributeValue("detailed")

  if (!loaded) return <SkeletonIcon {...props} />

  return (
    <Container ref={ref} {...props}>
      <FilterToolbox />
      {detailed ? (
        <Details />
      ) : (
        <ChartContainer column gap={4} padding={[4, 2]}>
          <GroupBoxes />
        </ChartContainer>
      )}
      {!detailed && <Footer />}
    </Container>
  )
}

export default withChart(GroupBoxesContainer)
