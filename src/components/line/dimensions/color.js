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
  const bg = valueKey === "ar" ? "anomalyTextLite" : chart.selectDimensionColor(id)

  const min = valueKey === "ar" ? 0 : chart.getAttribute("min")
  const max = valueKey === "ar" ? chart.getAttribute("maxAr") : chart.getAttribute("max")

  const minAbs = Math.abs(min)
  const maxAbs = Math.abs(max)

  const percentMin = max > 0 ? (min < 0 ? 0 : min) : maxAbs

  const value = useLatestValue(id, valueKey) || 0

  return (
    <BaseColorBar
      value={value}
      min={percentMin}
      max={maxAbs > minAbs ? maxAbs : minAbs}
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
