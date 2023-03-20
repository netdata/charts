import React from "react"
import { Transition } from "react-transition-group"
import { Flex, Collapsible } from "@netdata/netdata-ui"
import useHover from "@/components/useHover"
import useDebouncedValue from "@/components/helpers/useDebouncedValue"
import withChart from "@/components/hocs/withChart"
import { useChart, useAttributeValue } from "@/components/provider"
import Header from "./header"
import Details from "./details"
import ChartContentWrapper, { ContentWrapper } from "./chartContentWrapper"
import FilterToolbox from "./filterToolbox"
import Footer from "./footer"
import Container from "./container"
import Expander from "./expander"
import Drawer from "./drawer"

export const Line = ({ hasHeader = true, height, ...rest }) => {
  const chart = useChart()
  const detailed = useAttributeValue("detailed")

  const ref = useHover(
    {
      onHover: chart.focus,
      onBlur: chart.blur,
      isOut: node =>
        !node || (!node.closest("[data-toolbox]") && !node.closest("[data-testid=chart]")),
    },
    [chart]
  )

  const focused = useAttributeValue("focused")
  const debouncedFocused = useDebouncedValue(focused, 500)

  const expanded = useAttributeValue("expanded")

  return (
    <Transition nodeRef={ref} in={expanded} timeout={1000}>
      {expandTransitionState => (
        <Transition nodeRef={ref} in={focused && debouncedFocused} timeout={100}>
          {focusTransitionState => (
            <Container
              ref={ref}
              {...rest}
              expandTransitionState={expandTransitionState}
              focusTransitionState={focusTransitionState}
            >
              <Flex column position="relative" height={height}>
                {hasHeader && <Header />}
                <FilterToolbox />
                <ContentWrapper>{detailed ? <Details /> : <ChartContentWrapper />}</ContentWrapper>
              </Flex>
              <Collapsible open={!expanded && !detailed} duration={250}>
                <Footer expandTransitionState={expandTransitionState} />
              </Collapsible>

              <Collapsible open={expanded} duration={300}>
                <Drawer expandTransitionState={expandTransitionState} />
              </Collapsible>
              <Expander
                expanded={expanded}
                focusTransitionState={focusTransitionState}
                expandTransitionState={expandTransitionState}
              />
            </Container>
          )}
        </Transition>
      )}
    </Transition>
  )
}

export default withChart(Line)
