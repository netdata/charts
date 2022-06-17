import React, { memo, useRef, useEffect, useCallback } from "react"
import styled from "styled-components"
import { debounce } from "throttle-debounce"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import navLeft from "@netdata/netdata-ui/lib/components/icon/assets/nav_left.svg"
import navRight from "@netdata/netdata-ui/lib/components/icon/assets/nav_right.svg"
import useNavigationArrows from "@netdata/netdata-ui/lib/organisms/navigation/hooks/useNavigationArrows"
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

const Container = styled(Flex).attrs({
  gap: 1,
  padding: [0, 0, 2],
  alignItems: "center",
  flex: true,
  basis: "40px",
  "data-testid": "chartLegend",
})`
  overflow-x: auto; // fallback
  overflow-x: overlay;
  height: 40px;
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

const Dimensions = memo(({ setRef }) => {
  const dimensionIds = useDimensionIds()

  if (!dimensionIds) return null

  return (
    <Fragment>
      {dimensionIds.map(id => (
        <Dimension ref={setRef} key={id} id={id} />
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
  const dimensionItemsRef = useRef([])

  const [arrowLeft, arrowRight, onScroll] = useNavigationArrows(
    legendRef,
    dimensionItemsRef,
    [],
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

  const setDimensionRef = useCallback(
    dimentionItem => {
      if (!dimentionItem) return

      if (!dimensionItemsRef.current.includes(dimentionItem))
        dimensionItemsRef.current = [...dimensionItemsRef.current, dimentionItem]

      if (dimensionIds.length < dimensionItemsRef.current.length) {
        dimensionItemsRef.current = dimensionItemsRef.current.filter(
          node => node.getAttribute("id") === dimentionItem.getAttribute("id")
        )
      }
    },
    [dimensionIds.length]
  )

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
    <>
      {arrowLeft && (
        <Flex
          data-testid="filterTray-arrowLeft"
          cursor="pointer"
          onClick={scrollLeft}
          padding={[2]}
        >
          <Icon svg={navLeft} color="key" size="8px" />
        </Flex>
      )}
      <Container ref={legendRef} {...props} data-track={chart.track("legend")}>
        {!initialLoading && !empty && <Dimensions setRef={setDimensionRef} />}
        {initialLoading && <SkeletonDimensions />}
        {!initialLoading && empty && <EmptyDimension />}
      </Container>
      {arrowRight && (
        <Flex
          data-testid="filterTray-arrowRight"
          cursor="pointer"
          onClick={scrollRight}
          padding={[2]}
        >
          <Icon svg={navRight} color="key" size="8px" />
        </Flex>
      )}
    </>
  )
}

export default Legend
