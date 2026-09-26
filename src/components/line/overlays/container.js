import React, { useCallback, useRef, useState, useLayoutEffect, memo } from "react"
import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import { useChartUI } from "@/components/provider"

export const alignment = {
  chartMiddle: "chartMiddle",
  elementMiddle: "elementMiddle",
  elementRight: "elementRight",
  elementLeft: "elementLeft",
  elementFull: "elementFull",
}

const calcByAlignment = {
  [alignment.chartMiddle]: ({ from, chartWidth, element }) => [
    60,
    Math.min(from - 24, 60 + chartWidth / 2 + element.firstChild?.offsetWidth / 2),
  ],
  [alignment.chartLeft]: ({ chartWidth, element }) => [
    0,
    element.firstChild?.offsetWidth - chartWidth,
  ],
  [alignment.elementMiddle]: ({ from, width, element }) => [
    from,
    from + width / 2 + element.firstChild?.offsetWidth / 2,
  ],
  [alignment.elementRight]: ({ from, width }) => [from, from + width],
  [alignment.elementLeft]: ({ from }) => [from, from],
}

const HorizontalContainer = styled(Flex)`
  position: absolute;
  ${({ noTransform }) => (noTransform ? "" : "transform: translateY(-50%)")};
  ${({ top }) => top && `top: ${top};`};
  ${({ bottom }) => bottom && `bottom: ${bottom};`};
  ${({ left }) => left && `left: ${left};`};
  ${({ right }) => right && `right: ${right};`};
  ${({ noEvents }) => noEvents && `pointer-events: none;`};

  overflow: hidden;
`

const getHorizontalPosition = (align = alignment.elementMiddle, chartUI, area, element) => {
  const { from, width } = area

  const chartWidth = chartUI.getChartWidth()
  const calcAlignment = calcByAlignment[align] || calcByAlignment.elementMiddle

  return calcAlignment({ from, width, chartWidth, element })
}

const Container = ({ id, align, right = 0, fixed, children, uiName, ...rest }) => {
  const ref = useRef()
  const [area, setArea] = useState()
  const chartUI = useChartUI(uiName)

  const updateRight = useCallback(
    area => {
      if (!area || !ref.current) return

      const [, calculatedRight] = getHorizontalPosition(align, chartUI, area, ref.current)

      ref.current.style.right = `calc(100% - ${calculatedRight + right}px)`
    },
    [align, chartUI, right]
  )

  useLayoutEffect(
    () =>
      !fixed &&
      chartUI.on(`overlayedAreaChanged:${id}`, area => {
        updateRight(area)
        setArea(current => (!!current !== !!area ? area : current))
      }),
    [chartUI, fixed, id, updateRight]
  )

  useLayoutEffect(() => {
    if (!fixed) updateRight(area)
  }, [area, fixed, updateRight])

  if (!area && !fixed) return null

  return (
    <HorizontalContainer ref={ref} {...rest}>
      {children}
    </HorizontalContainer>
  )
}

export default memo(Container)
