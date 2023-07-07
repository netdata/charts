import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"

const Container = styled(Flex).attrs(props => ({
  "data-testid": "chart",
  column: true,
  position: "relative",
  round: true,
  background: "panelBg",
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
