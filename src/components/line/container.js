import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"

const Container = styled(Flex).attrs(props => ({
  "data-testid": "chart",
  border: { color: "borderSecondary", side: "all" },
  column: true,
  round: true,
  ...props,
}))`
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  ::selection {
    background: transparent;
  }
  ::-moz-selection {
    background: transparent;
  }
`

export default Container
