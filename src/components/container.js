import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import { radius } from "./modern/tokens"

const Container = styled(Flex).attrs(({ height = "100%", width = "100%", ...rest }) => ({
  "data-testid": "chart",
  "data-type": "chart",
  column: true,
  position: "relative",
  round: radius.card,
  border: false,
  background: "cardBackground",
  height: typeof height === "string" ? height : `${height}px`,
  width: typeof width === "string" ? width : `${width}px`,
  ...rest,
}))``

export default Container
