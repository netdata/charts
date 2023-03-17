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

  ${props =>
    props.focusTransitionState === "entering" || props.focusTransitionState === "entered"
      ? `
      max-height: 100%;
      `
      : `
      opacity: initial;
      `}

  ::after {
    content: "";
    position: absolute;
    transition: all 0.3s ease-in-out;
    box-shadow: 0px 0px 12px rgba(9, 30, 66, 0.15), 0px 0px 1px rgba(9, 30, 66, 0.31);
    opacity: 0;
    z-index: -11;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    ${props =>
      props.focusTransitionState === "entering" || props.focusTransitionState === "entered"
        ? `
      opacity: 1;
      `
        : `
      opacity: 0;
      `}
  }
`

export default Container
