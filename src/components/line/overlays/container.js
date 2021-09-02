import React, { useRef, useState, useLayoutEffect, memo } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useChart } from "@/components/provider"

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

const getRight = (alignMiddle, chart, area, element) => {
  const { from, width } = area

  if (!alignMiddle) return from + width / 2 + element.firstChild.offsetWidth / 2

  const chartWidth = chart.getUI().getChartWidth()

  return Math.min(from - 24, 60 + chartWidth / 2 + element.firstChild.offsetWidth / 2)
}

const Container = ({ id, alignMiddle, children, ...rest }) => {
  const ref = useRef()
  const [area, setArea] = useState()
  const chart = useChart()

  const updateRight = area => {
    if (!area || !ref.current) return

    const right = getRight(alignMiddle, chart, area, ref.current)
    ref.current.style.right = `calc(100% - ${right}px)`
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
