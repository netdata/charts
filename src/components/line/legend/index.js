import React, { memo, useRef, useEffect } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
// import { getSizeBy, getRgbColor } from "@netdata/netdata-ui/lib/theme/utils"
// import { webkitVisibleScrollbar } from "@netdata/netdata-ui/lib/mixins/webkit-visible-scrollbar"
import {
  useInitialLoading,
  useEmpty,
  useDimensionIds,
  useChart,
  useAttributeValue,
} from "@/components/provider"
import Dimension, { SkeletonDimension, EmptyDimension } from "./dimension"
import { Fragment } from "react"

const Container = styled(Flex).attrs({
  gap: 1,
  padding: [0, 0, 1],
  alignItems: "center",
  flex: true,
  basis: 0,
  "data-testid": "chartLegend",
})`
  overflow-x: auto; // fallback
  overflow-x: overlay;

  ::-webkit-scrollbar {
    height: 6px;
  }
`

const getPositions = el => {
  if (!el) return
  return {
    x: el.scrollLeft,
  }
}

const skeletonDimensions = Array.from(Array(5))

const SkeletonDimensions = () => (
  <Fragment>
    {skeletonDimensions.map((v, index) => (
      <SkeletonDimension key={index} />
    ))}
  </Fragment>
)

const Dimensions = memo(() => {
  const dimensionIds = useDimensionIds()

  if (!dimensionIds) return null

  return (
    <Fragment>
      {dimensionIds.map(id => (
        <Dimension key={id} id={id} />
      ))}
    </Fragment>
  )
})

const Legend = props => {
  const chart = useChart()
  const initialLoading = useInitialLoading()
  const empty = useEmpty()
  const updateLegendScroll = value => chart.updateAttribute("legendScroll", value)
  const isActive = useAttributeValue("active")

  const legendRef = useRef(null)

  useEffect(() => {
    if (legendRef.current && isActive) {
      legendRef.current.scrollTo({ left: chart.getAttribute("legendScroll") })
    }
  }, [legendRef.current, isActive])

  useEffect(() => {
    const listener = () => {
      const { x } = getPositions(legendRef.current)
      updateLegendScroll(x)
    }
    const options = {
      capture: false,
      passive: true,
    }

    if (legendRef.current) {
      legendRef.current.addEventListener("scroll", listener, options)
    }
    return () => {
      if (legendRef.current) legendRef.current.removeEventListener("scroll", listener, options)
    }
  }, [legendRef.current])

  return (
    <Container ref={legendRef} {...props} data-track={chart.track("legend")}>
      {!initialLoading && !empty && <Dimensions />}
      {initialLoading && <SkeletonDimensions />}
      {!initialLoading && empty && <EmptyDimension />}
    </Container>
  )
}

export default Legend
