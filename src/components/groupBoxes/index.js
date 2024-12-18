import React from "react"
import useForwardRef from "@netdata/netdata-ui/dist/hooks/useForwardRef"
import useHover from "@/components/useHover"
import withChart from "@/components/hocs/withChart"
import { useChart, useAttributeValue } from "@/components/provider"
import ChartContainer from "@/components/chartContainer"
import Header from "@/components/header"
import FilterToolbox from "@/components/filterToolbox"
import Container from "@/components/container"
import GroupBoxes from "./groupBoxes"
import Footer from "./footer"

export const GroupBoxesContainer = ({ uiName, ref, ...rest }) => {
  const chart = useChart()

  const hoverRef = useHover(
    {
      onHover: chart.focus,
      onBlur: chart.blur,
      isOut: node =>
        !node ||
        (!node.closest(`[data-toolbox="${chart.getId()}"]`) &&
          !node.closest(`[data-chartid="${chart.getId()}"]`)),
    },
    [chart]
  )

  const [, setRef] = useForwardRef(node => {
    hoverRef.current = node
    if (ref) ref.current = node
  })

  const showingInfo = useAttributeValue("showingInfo")
  const focused = useAttributeValue("focused")

  return (
    <Container ref={setRef} {...rest}>
      <Header />
      <FilterToolbox opacity={focused ? 1 : 0.7} />
      <ChartContainer uiName={uiName} column gap={4} padding={[4, 2]}>
        <GroupBoxes uiName={uiName} />
      </ChartContainer>

      {!showingInfo && <Footer />}
    </Container>
  )
}

export default withChart(GroupBoxesContainer)
