import React, { useRef, useEffect, useState } from "react"
import styled from "styled-components"
import { debounce } from "throttle-debounce"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Box, Flex } from "@netdata/netdata-ui"
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

  &::-webkit-scrollbar {
    height: 0;
  }
`

const skeletonDimensions = Array.from(Array(5))

const SkeletonDimensions = () => (
  <Fragment>
    {skeletonDimensions.map((v, index) => (
      <SkeletonDimension key={index} />
    ))}
  </Fragment>
)

const VirtualItem = styled(Flex).attrs({
  alignItems: "center",
  padding: [0, 0.5, 0, 0],
})`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
`

const VirtualDimensions = ({ virtualizer, dimensionIds }) => (
  <Box position="relative" flex={false} height="100%" width={`${virtualizer.getTotalSize()}px`}>
    {virtualizer.getVirtualItems().map(virtualItem => {
      const id = dimensionIds[virtualItem.index]

      return (
        <VirtualItem
          key={id}
          data-index={virtualItem.index}
          ref={virtualizer.measureElement}
          style={{ transform: `translateX(${virtualItem.start}px)` }}
        >
          <Dimension id={id} />
        </VirtualItem>
      )
    })}
  </Box>
)

const Legend = props => {
  const dimensionIds = useDimensionIds()
  const chart = useChart()
  const initialLoading = useInitialLoading()
  const empty = useEmpty()
  const active = useAttributeValue("active")

  const legendRef = useRef(null)

  const [arrowLeft, setArrowLeft] = useState(false)
  const [arrowRight, setArrowRight] = useState(false)

  const virtualizer = useVirtualizer({
    horizontal: true,
    count: dimensionIds?.length || 0,
    getScrollElement: () => legendRef.current,
    estimateSize: () => 200,
    overscan: 5,
  })

  const totalSize = virtualizer.getTotalSize()

  const updateArrows = () => {
    const el = legendRef.current
    if (!el) return

    setArrowLeft(el.scrollLeft > 20)
    setArrowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 20)
  }

  useEffect(() => {
    if (legendRef.current && active) {
      legendRef.current.scrollTo({ left: chart.getAttribute("legendScroll") })
    }
  }, [legendRef.current, active])

  useEffect(updateArrows, [totalSize])

  useEffect(() => {
    const scroll = () => {
      const el = legendRef.current
      if (!el) return

      chart.updateAttribute("legendScroll", el.scrollLeft)
      updateArrows()
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
    <Flex overflow="hidden" position="relative" height="100%">
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
        {!initialLoading && !empty && dimensionIds && (
          <VirtualDimensions virtualizer={virtualizer} dimensionIds={dimensionIds} />
        )}
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
