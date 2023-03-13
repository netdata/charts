import React from "react"
import styled from "styled-components"
import { Flex, TextMicro, TextSmall } from "@netdata/netdata-ui"

const GridRow = styled(Flex).attrs({
  "data-testid": "chartPopover-label",
})`
  display: contents;
`

const Label = ({ label, value, chars }) => (
  <GridRow>
    <TextMicro padding={[1, 0]}>{label}</TextMicro>
    <TextSmall strong>{value?.join(", ") || "-"}</TextSmall>
  </GridRow>
)

export default Label
