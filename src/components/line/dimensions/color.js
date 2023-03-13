import React, { useLayoutEffect, useRef } from "react"
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

export const BaseColorBar = ({ value, min, max, valueKey, bg, ...rest }) => {
  const ref = useRef()

  useLayoutEffect(() => {
    if (!ref.current) return

    const animateWidth = () =>
      ref.current && (ref.current.style.width = `${((Math.abs(value) - min) * 100) / (max - min)}%`)

    requestAnimationFrame(animateWidth)
  }, [value, valueKey, min, max])

  if (!bg) return null

  return <Color ref={ref} bg={bg} width={{ min: !value ? 0 : 2 }} {...rest} />
}

export const ColorBar = ({ id, valueKey, ...rest }) => {
  const chart = useChart()
  const bg = valueKey === "ar" ? ["purple", "lilac"] : chart.selectDimensionColor(id)

  const min = Math.abs(valueKey === "ar" ? 0 : chart.getAttribute("min"))
  const max = Math.abs(valueKey === "ar" ? chart.getAttribute("maxAr") : chart.getAttribute("max"))
  const value = useLatestValue(id, valueKey) || 0

  return (
    <BaseColorBar
      value={value}
      min={max > min ? min : max}
      max={max > min ? max : min}
      valueKey={valueKey}
      bg={bg}
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
