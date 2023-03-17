import React from "react"
import styled from "styled-components"
import { Flex, TextSmall, getColor } from "@netdata/netdata-ui"
import chevronExpand from "@netdata/netdata-ui/lib/components/icon/assets/chevron_expand.svg"
import { useChart } from "@/components/provider"
import Icon from "@/components/icon"

const Container = styled(Flex).attrs(props => ({
  "data-testid": "chartExpander",
  position: "absolute",
  alignItems: "center",
  justifyContent: "center",
  background: "panelBg",
  gap: 1,
  padding: [1],
  ...props,
}))`
  transition: all 0.3s ease-in-out;
  box-shadow: 0px 8px 12px rgba(9, 30, 66, 0.15), 0px 0px 1px rgba(9, 30, 66, 0.31);
  opacity: 0;
  z-index: 1;
  bottom: 1px;
  left: -1px;
  right: -1px;
  border-right: 1px solid ${getColor("borderSecondary")};
  border-bottom: 1px solid ${getColor("borderSecondary")};
  border-left: 1px solid ${getColor("borderSecondary")};

  &:hover > * {
    color: ${getColor("textFocus")};
    fill: ${getColor("textFocus")};
  }

  ${props => {
    switch (props.focusTransitionState) {
      case "entering":
        return `
          opacity: 1;
          transform: translateY(100%);
          z-index: 10;
        `
      case "entered":
        return `
          opacity: 1;
          transform: translateY(100%);
          z-index: 10;
        `
      case "exiting":
        return `
          z-index: -10;
        `
      case "exited":
      default:
        return `
          opacity: 0;
          transform: translateY(0);
          z-index: -10;
        `
    }
  }}
  ${props => {
    switch (props.expandTransitionState) {
      case "entering":
        return `
          opacity: 1;
          transform: translateY(0);
          z-index: 10;
          bottom: auto;
          position: relative;
          left: auto;
          right: auto;
        `
      case "entered":
        return `
          opacity: 1;
          transform: translateY(0);
          z-index: 10;
          bottom: auto;
          position: relative;
          left: auto;
          right: auto;
        `
      // case "exiting":
      //   return `
      //     z-index: -10;
      //   `
      // case "exited":
      // default:
      //   return `
      //     opacity: 0;
      //     transform: translateY(0);
      //     z-index: -10;
      //   `
    }
  }}
`

const Expander = ({ focusTransitionState, expandTransitionState, expanded }) => {
  const chart = useChart()

  return (
    <Container
      focusTransitionState={focusTransitionState}
      expandTransitionState={expandTransitionState}
      cursor="pointer"
      onClick={() => chart.updateAttribute("expanded", !expanded)}
    >
      <Icon svg={chevronExpand} color="text" width="7.5px" height="5px" rotate={expanded ? 2 : 0} />
      <TextSmall color="text">{expanded ? "Collapse" : "Expand"}</TextSmall>
      <Icon svg={chevronExpand} color="text" width="7.5px" height="5px" rotate={expanded ? 2 : 0} />
    </Container>
  )
}

export default Expander
