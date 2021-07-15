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
  ${({ top }) => (top === undefined ? "" : `top: ${top}px;`)};
  ${({ bottom }) => (bottom === undefined ? "" : `bottom: ${bottom}px;`)};

  direction: rtl;
  overflow: hidden;
`

const Container = ({ id, children, ...rest }) => {
  const ref = useRef()
  const [area, setArea] = useState()
  const chart = useChart()

  const updateRight = area => {
    if (!area || !ref.current) return

    const { from, width } = area
    const right = from + width / 2 + ref.current.firstChild.offsetWidth / 2
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
