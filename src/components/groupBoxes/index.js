import React from "react"
import useHover from "@/components/useHover"
import withChart from "@/components/hocs/withChart"
import { useChart, useAttributeValue } from "@/components/provider"
import ChartContainer from "@/components/chartContainer"
import Header from "./header"
import FilterToolbox from "@/components/line/filterToolbox"
import Container from "@/components/line/container"
import GroupBoxes from "./groupBoxes"
import Footer from "./footer"

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

  const detailed = useAttributeValue("detailed")

  return (
    <Container ref={ref} {...props}>
      <Header />
      <FilterToolbox />
      <ChartContainer column gap={4} padding={[4, 2]}>
        <GroupBoxes />
      </ChartContainer>

      {!detailed && <Footer />}
    </Container>
  )
}

export default withChart(GroupBoxesContainer)
