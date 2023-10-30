import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"

const Container = styled(Flex).attrs(({ height, width, ...rest }) => ({
  "data-testid": "chart",
  column: true,
  position: "relative",
  round: true,
  border: { color: "mainChartBorder", side: "all" },
  background: "mainChartBg",
  height: typeof height === "string" ? height : `${height}px`,
  width: typeof width === "string" ? width : `${width}px`,
  ...rest,
}))`
  ::selection {
    background: transparent;
  }
  ::-moz-selection {
    background: transparent;
  }
`

export default Container
