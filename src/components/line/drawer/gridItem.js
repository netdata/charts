import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"

export default styled(Flex)`
  grid-area: ${({ area }) => area};
`
