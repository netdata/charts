import React, { useLayoutEffect, useRef } from "react"
import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import { useChart, useLatestValue } from "@/components/provider"
import { useIsHeatmap, useGetColor } from "@/helpers/heatmap"

export const Color = styled(Flex).attrs(({ bg, ...rest }) => ({
  width: "4px",
  round: true,
  "data-testid": "chartDimensions-color",
  flex: false,
  background: bg,
  ...rest,
}))`
  pointer-events: none;
`

export const BaseColorBar = ({
  value,
  min,
  max,
  valueKey,
  bg,
  styleDimension = "width",
  ...rest
}) => {
  const ref = useRef()

  useLayoutEffect(() => {
    if (!ref.current) return

    const animateStyle = () =>
      ref.current &&
      (ref.current.style[styleDimension] = value
        ? `${((Math.abs(value) - min) * 100) / (max - min)}%`
        : 0)

    requestAnimationFrame(animateStyle)
  }, [value, valueKey, min, max])

  const isHeatmap = useIsHeatmap()
  const getHeatmapColor = useGetColor(0.4)

  if (!bg) return null

  return (
    <Color
      ref={ref}
      width={{ min: 1 }}
      bg={bg}
      sx={{ background: isHeatmap ? getHeatmapColor(value) : undefined }}
      {...rest}
    />
  )
}

export const ColorBar = ({ id, valueKey, ...rest }) => {
  const chart = useChart()
  const bg = valueKey === "arp" ? "anomalyTextLite" : chart.selectDimensionColor(id)

  const min = valueKey === "arp" ? 0 : chart.getAttribute("min")
  const max = valueKey === "arp" ? 100 : chart.getAttribute("max")

  const minAbs = Math.abs(min)
  const maxAbs = Math.abs(max)

  const percentMin = max > 0 ? (min < 0 ? 0 : min) : maxAbs

  const value = useLatestValue(id, { valueKey }) || 0

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
