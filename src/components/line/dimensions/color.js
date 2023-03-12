import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useChart, useLatestValue } from "@/components/provider"

export const Color = styled(Flex).attrs(({ bg, ...rest }) => ({
  width: "4px",
  round: true,
  "data-testid": "chartDimensions-color",
  flex: false,
  background: bg,
  ...rest,
}))``

export const ColorBar = ({ id, valueKey, ...rest }) => {
  const chart = useChart()
  const bg = valueKey === "ar" ? ["purple", "lilac"] : chart.selectDimensionColor(id)

  const min = valueKey === "ar" ? 0 : chart.getAttribute("min")
  const max = valueKey === "ar" ? 100 : chart.getAttribute("max")
  const value = useLatestValue(id, valueKey) || 0

  if (!bg) return null

  return (
    <Color
      bg={bg}
      width={{ min: 1, base: `${Math.abs(value / (value < 0 ? min : max)) * 100}%` }}
      {...rest}
    />
  )
}

const ColorValue = ({ id, ...rest }) => {
  const chart = useChart()
  const bg = chart.selectDimensionColor(id)

  if (!bg) return null

  return <Color bg={bg} {...rest} />
}

export default ColorValue
