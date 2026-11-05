import styled from "styled-components"
import { Box } from "@netdata/netdata-ui"
import { radius } from "@/components/modern/tokens"

export const Dot = styled(Box).attrs(({ size = 2 }) => ({
  as: "span",
  width: size,
  height: size,
  round: radius.pill,
}))`
  flex: none;
`
