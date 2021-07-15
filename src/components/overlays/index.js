import React, { useEffect, useRef, useState, memo, useLayoutEffect } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useAttributeValue, useChart } from "@/components/provider"
import { Fragment } from "react"
import Badge from "@/components/badge"

const badgeByStatus = {
  critical: "error",
  clear: "success",
}

const Highlight = memo(({ value, status }) => {
  const badgeType = badgeByStatus[status] || status
  console.log(badgeType, status)
  return <Badge type={badgeType}>{value}</Badge>
})

const HorizontalContainer = styled(Flex)`
  position: absolute;
  overflow: hidden;
  transform: translateY(-50%);
  right: calc(0);
  left: 60px;
  top: 20px;
  margin-right: 30px;
  direction: rtl;
  overflow: hidden;
`

const AlarmOverlay = ({ id }) => {
  const chart = useChart()
  const overlays = useAttributeValue("overlays")

  const ref = useRef()
  const [area, setArea] = useState()

  const updateRight = area => {
    if (!area || !ref.current) return

    const { from, width } = area
    const right = from + width / 2 + ref.current.firstChild.offsetWidth / 2
    ref.current.style.right = `calc(100% - ${right}px)`
  }

  useEffect(
    () =>
      chart.getUI().on(`overlayedAreaChanged:${id}`, area => {
        updateRight(area)
        setArea(s => (!!s !== !!area ? area : s))
      }),
    []
  )

  useLayoutEffect(() => updateRight(area), [area])

  if (!area) return null

  const { value, status } = overlays[id]

  return (
    <HorizontalContainer ref={ref}>
      <Highlight value={value} status={status} />
    </HorizontalContainer>
  )
}

const byType = {
  alarm: AlarmOverlay,
}

const Overlays = () => {
  const overlays = useAttributeValue("overlays")

  return (
    <Fragment>
      {Object.keys(overlays).map(id => {
        const { type } = overlays[id]
        const Overlay = byType[type]
        return <Overlay key={id} id={id} />
      })}
    </Fragment>
  )
}

export default memo(Overlays)
