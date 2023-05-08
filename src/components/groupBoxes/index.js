import React, { forwardRef } from "react"
import useForwardRef from "@netdata/netdata-ui/lib/hooks/use-forward-ref"
import useHover from "@/components/useHover"
import withChart from "@/components/hocs/withChart"
import { useChart, useAttributeValue } from "@/components/provider"
import ChartContainer from "@/components/chartContainer"
import Header from "@/components/header"
import FilterToolbox from "@/components/filterToolbox"
import Container from "@/components/container"
import GroupBoxes from "./groupBoxes"
import Footer from "./footer"

export const GroupBoxesContainer = forwardRef(({ uiName, ...rest }, ref) => {
  const chart = useChart()

  const hoverRef = useHover(
    {
      onHover: chart.focus,
      onBlur: chart.blur,
      isOut: node =>
        !node || (!node.closest("[data-toolbox]") && !node.closest("[data-testid=chart]")),
    },
    [chart]
  )

  const [, setRef] = useForwardRef(node => {
    hoverRef.current = node
    ref.current = node
  })

  const showingInfo = useAttributeValue("showingInfo")

  return (
    <Container ref={setRef} {...rest}>
      <Header />
      <FilterToolbox />
      <ChartContainer uiName={uiName} column gap={4} padding={[4, 2]}>
        <GroupBoxes uiName={uiName} />
      </ChartContainer>

      {!showingInfo && <Footer />}
    </Container>
  )
})

export default withChart(GroupBoxesContainer)
