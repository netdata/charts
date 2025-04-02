import React from "react"
import useForwardRef from "@netdata/netdata-ui/dist/hooks/useForwardRef"
import useHover from "@/components/useHover"
import withChart from "@/components/hocs/withChart"
import { useChart, useAttributeValue, useIsMinimal } from "@/components/provider"
import Header from "@/components/header"
import Details from "@/components/details"
import ChartContentWrapper, { ContentWrapper } from "./chartContentWrapper"
import FilterToolbox from "@/components/filterToolbox"
import Container from "@/components/container"
import Footer from "./footer"

export const Line = ({
  hasHeader = true,
  hasFooter = true,
  hasFilters = true,
  uiName,
  ref,
  ...rest
}) => {
  const chart = useChart()
  const showingInfo = useAttributeValue("showingInfo")
  const sparkline = useAttributeValue("sparkline")

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

  const focused = useAttributeValue("focused")
  const isMinimal = useIsMinimal()

  return (
    <Container
      ref={setRef}
      {...(sparkline && { border: false, background: "transparent" })}
      {...rest}
      {...(isMinimal && { border: 0 })}
    >
      {hasHeader && <Header hasFilters={hasFilters} />}
      {!isMinimal && hasFilters && <FilterToolbox opacity={focused ? 1 : 0.7} />}
      <ContentWrapper>
        {showingInfo ? <Details /> : <ChartContentWrapper uiName={uiName} />}
      </ContentWrapper>
      {hasFooter && <Footer />}
    </Container>
  )
}


export default withChart(Line)
