import styled, { css } from "styled-components"
import { Box, TextNano, TextSmall } from "@netdata/netdata-ui"
import { numeralsFont, tabularNumbers } from "@/components/modern/tokens"

export const numerals = css`
  font-family: ${numeralsFont};
  ${tabularNumbers}
`

export const Numeral = styled(Box).attrs({ as: "span" })`
  ${numerals}
  white-space: nowrap;
`

export const SmallNumeral = styled(TextSmall)`
  ${numerals}
`

export const NanoNumeral = styled(TextNano)`
  ${numerals}
`
