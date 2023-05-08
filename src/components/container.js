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
`

export default Container
