import React from "react"
import styled from "styled-components"
import { Box, Flex, getColor } from "@netdata/netdata-ui"

const Track = styled(Flex).attrs({
  flex: false,
  width: "56px",
  height: "6px",
  overflow: "hidden",
  "data-testid": "modernTable-meter",
})`
  border-radius: 3px;
  background: ${getColor("borderSecondary")};
`

const Fill = styled(Box).attrs({ height: "100%" })`
  border-radius: 3px;
  transition: width 200ms ease;
`

export const clampPercent = value => {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.min(100, Math.max(0, Math.abs(number)))
}

const Meter = ({ value, color }) => {
  const percent = clampPercent(value)

  return (
    <Track role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      <Fill style={{ width: `${percent}%`, background: color }} />
    </Track>
  )
}

export default Meter
