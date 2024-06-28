import React, { memo, useRef, useEffect } from "react"
import styled from "styled-components"
import { debounce } from "throttle-debounce"
import { Flex, useNavigationArrows } from "@netdata/netdata-ui"
import navLeft from "@netdata/netdata-ui/dist/components/icon/assets/nav_left.svg"
import navRight from "@netdata/netdata-ui/dist/components/icon/assets/nav_right.svg"
import {
  useInitialLoading,
  useEmpty,
  useDimensionIds,
  useChart,
  useAttributeValue,
} from "@/components/provider"
import Dimension, { SkeletonDimension, EmptyDimension } from "./dimension"
import { Fragment } from "react"
import Icon from "@/components/icon"

const Container = styled(Flex).attrs(props => ({
  gap: 0.5,
  padding: [0, 0, 1],
  alignItems: "center",
  flex: true,
  "data-testid": "chartLegend",
  ...props,
}))`
  overflow-x: auto; // fallback
  overflow-x: overlay;
  overflow-y: hidden;

  ::-webkit-scrollbar {
    height: 6px;
  }
`

const getPositions = el => {
  if (!el) return { x: 0 }
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

const Dimensions = memo(({ lastItemRef }) => {
  const dimensionIds = useDimensionIds()

  if (!dimensionIds) return null

  return (
    <Fragment>
      {dimensionIds.map((id, index) => (
        <Dimension
          {...(index === dimensionIds.length - 1 && { ref: lastItemRef })}
          key={id}
          id={id}
        />
      ))}
    </Fragment>
  )
})

const Legend = props => {
  const dimensionIds = useDimensionIds()
  const chart = useChart()
  const initialLoading = useInitialLoading()
  const empty = useEmpty()
  const active = useAttributeValue("active")

  const legendRef = useRef(null)
  const lastItemRef = useRef()

  const [arrowLeft, arrowRight, onScroll] = useNavigationArrows(
    legendRef,
    lastItemRef,
    dimensionIds.length,
    true
  )

  useEffect(() => {
    if (legendRef.current && active) {
      legendRef.current.scrollTo({ left: chart.getAttribute("legendScroll") })
    }
  }, [legendRef.current, active])

  useEffect(() => {
    const scroll = () => {
      const { x } = getPositions(legendRef.current)
      chart.updateAttribute("legendScroll", x)
      onScroll()
    }

    scroll()

    const handlers = debounce(300, scroll)

    handlers()

    window.addEventListener("resize", handlers)

    if (!legendRef.current) return
    legendRef.current.addEventListener("scroll", scroll)
    return () => {
      window.removeEventListener("resize", handlers)

      if (!legendRef.current) return
      legendRef.current.removeEventListener("scroll", scroll)
    }
  }, [legendRef.current])

  const scrollLeft = e => {
    e.preventDefault()
    const container = legendRef.current
    container.scrollTo({
      left: container.scrollLeft - 100,
      behavior: "smooth",
    })
  }

  const scrollRight = e => {
    e.preventDefault()
    const container = legendRef.current
    container.scrollTo({
      left: container.scrollLeft + 100,
      behavior: "smooth",
    })
  }

  return (
    <Flex overflow="hidden" position="relative">
      {arrowLeft && (
        <Flex
          data-testid="filterTray-arrowLeft"
          cursor="pointer"
          onClick={scrollLeft}
          padding={[0, 1]}
          height="100%"
          position="absolute"
          left={0}
          background="mainChartBg"
          alignItems="center"
        >
          <Icon svg={navLeft} color="key" size="8px" />
        </Flex>
      )}
      <Container ref={legendRef} {...props} data-track={chart.track("legend")}>
        {!initialLoading && !empty && <Dimensions lastItemRef={lastItemRef} />}
        {initialLoading && <SkeletonDimensions />}
        {!initialLoading && empty && <EmptyDimension />}
      </Container>
      {arrowRight && (
        <Flex
          data-testid="filterTray-arrowRight"
          cursor="pointer"
          onClick={scrollRight}
          padding={[0, 1]}
          height="100%"
          position="absolute"
          right={0}
          background="mainChartBg"
          alignItems="center"
        >
          <Icon svg={navRight} color="key" size="8px" />
        </Flex>
      )}
    </Flex>
  )
}

export default Legend
