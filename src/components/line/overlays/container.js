import React, { useRef, useState, useLayoutEffect, memo } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useChart } from "@/components/provider"

export const alignment = {
  chartMiddle: "chartMiddle",
  elementMiddle: "elementMiddle",
  elementRight: "elementRight",
  elementLeft: "elementLeft",
}

const calcByAlignment = {
  [alignment.chartMiddle]: ({ from, chartWidth, element }) =>
    Math.min(from - 24, 60 + chartWidth / 2 + element.firstChild.offsetWidth / 2),
  [alignment.elementMiddle]: ({ from, width, element }) =>
    from + width / 2 + element.firstChild.offsetWidth / 2,
  [alignment.elementRight]: ({ from, width }) => from + width,
  [alignment.elementLeft]: ({ from }) => from,
}

const HorizontalContainer = styled(Flex)`
  position: absolute;
  overflow: hidden;
  transform: translateY(-50%);
  right: calc(0);
  left: 60px;
  ${({ top }) => (top === undefined ? "" : `top: ${top};`)};
  ${({ bottom }) => (bottom === undefined ? "" : `bottom: ${bottom};`)};

  direction: rtl;
  overflow: hidden;
`

const getRight = (align = alignment.elementMiddle, chart, area, element) => {
  const { from, width } = area

  const chartWidth = chart.getUI().getChartWidth()
  const calcAlignment = calcByAlignment[align] || calcByAlignment.elementMiddle

  return calcAlignment({ from, width, chartWidth, element })
}

const Container = ({ id, align, right, children, ...rest }) => {
  const ref = useRef()
  const [area, setArea] = useState()
  const chart = useChart()

  const updateRight = area => {
    if (!area || !ref.current) return

    const calculatedRight = getRight(align, chart, area, ref.current)
    ref.current.style.right = `calc(100% - ${calculatedRight + right}px)`
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
