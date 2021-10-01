import React, { useRef, useState, useLayoutEffect, memo } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useChart } from "@/components/provider"

export const alignment = {
  chartMiddle: "chartMiddle",
  elementMiddle: "elementMiddle",
  elementRight: "elementRight",
  elementLeft: "elementLeft",
  elementFull: "elementFull",
}

const calcByAlignment = {
  [alignment.chartMiddle]: ({ from, chart, element }) => [
    60,
    Math.min(
      from - 24,
      60 + chart.getUI().getChartWidth() / 2 + element.firstChild.offsetWidth / 2
    ),
  ],
  [alignment.elementMiddle]: ({ from, width, element }) => [
    from,
    from + width / 2 + element.firstChild.offsetWidth / 2,
  ],
  [alignment.elementRight]: ({ from, width }) => [from, from + width],
  [alignment.elementLeft]: ({ from }) => [from, from],
}

const HorizontalContainer = styled(Flex)`
  position: absolute;
  ${({ noTransform }) => (noTransform ? "" : "transform: translateY(-50%)")};
  ${({ top }) => (top === undefined ? "" : `top: ${top};`)};
  ${({ bottom }) => (bottom === undefined ? "" : `bottom: ${bottom};`)};

  direction: rtl;
  overflow: hidden;
`

const getHorizontalPosition = (align = alignment.elementMiddle, chart, area, element) => {
  const { from, width } = area

  const chartWidth = chart.getUI().getChartWidth()
  const calcAlignment = calcByAlignment[align] || calcByAlignment.elementMiddle

  return calcAlignment({ from, width, chartWidth, element })
}

const Container = ({ id, align, right = 0, left = 0, children, ...rest }) => {
  const ref = useRef()
  const [area, setArea] = useState()
  const chart = useChart()

  const updateRight = area => {
    if (!chart || !area || !ref.current) return

    const [calculatedLeft, calculatedRight] = getHorizontalPosition(align, chart, area, ref.current)

    ref.current.style.right = `calc(100% - ${calculatedRight + right}px)`
    ref.current.style.left = `${calculatedLeft + left}px`
  }

  useLayoutEffect(
    () =>
      chart.getUI().on(`overlayedAreaChanged:${id}`, area => {
        updateRight(area)
        setArea(s => (!!s !== !!area ? area : s))
      }),
    []
  )

  useLayoutEffect(() => updateRight(area), [area])

  if (!area) return null

  return (
    <HorizontalContainer ref={ref} {...rest}>
      {children}
    </HorizontalContainer>
  )
}

export default memo(Container)
