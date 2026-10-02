import React from "react"
import styled from "styled-components"
import { Box } from "@netdata/netdata-ui"

export const Swatch = styled(Box).attrs({ as: "span" })`
  display: inline-block;
  flex: 0 0 auto;
  background: ${({ swatchColor }) => swatchColor || "transparent"};
`

export const LineSwatch = styled(Swatch).attrs({
  "data-testid": "modernLegend-swatch",
  width: 2.5,
  round: 0.5,
})`
  height: 3px;
`

export const SquareSwatch = props => <Swatch width={2} height={2} round={0.5} {...props} />
