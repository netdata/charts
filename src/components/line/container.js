import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"

const Container = styled(Flex).attrs(props => ({
  "data-testid": "chart",
  column: true,
  position: "relative",
  border: { color: "borderSecondary", side: "all" },
  round: true,
  ...props,
}))`
  ::selection {
    background: transparent;
  }
  ::-moz-selection {
    background: transparent;
  }
  transition: all 0.3s ease-in-out;

  ${props =>
    props.focusTransitionState === "entering" || props.focusTransitionState === "entered"
      ? `
      max-height: 100%;
      box-shadow: 0px 0px 12px rgba(9, 30, 66, 0.15), 0px 0px 1px rgba(9, 30, 66, 0.31);
      `
      : `
      opacity: initial;
      `}
`

export default Container
