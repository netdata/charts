import React, { memo, useCallback, useRef, useEffect } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import navLeft from "@netdata/netdata-ui/lib/components/icon/assets/nav_left.svg"
import navRight from "@netdata/netdata-ui/lib/components/icon/assets/nav_right.svg"
import useNavigationArrow from "@netdata/netdata-ui/lib/organisms/navigation/hooks/useNavigationArrows"
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
import Icon from "@/components/icon"

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
  const updateLegendScroll = value => chart.updateAttribute("legendScroll", value)
  const isActive = useAttributeValue("active")

  const legendRef = useRef(null)
  const dimensionItemsRef = useRef([])

  const [arrowLeft, arrowRight, onScroll] = useNavigationArrow(
    legendRef,
    filterTrayItemsRef,
    [],
    true
  )

  useEffect(() => {
    if (legendRef.current && isActive) {
      legendRef.current.scrollTo({ left: chart.getAttribute("legendScroll") })
    }
  }, [legendRef.current, isActive])

  useEffect(() => {
    const listener = () => {
      const { x } = getPositions(legendRef.current)
      updateLegendScroll(x)
      onScroll()
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
    <Container ref={legendRef} {...props} data-track={chart.track("legend")}>
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
      {!initialLoading && !empty && <Dimensions setRef={setDimensionRef} />}
      {initialLoading && <SkeletonDimensions />}
      {!initialLoading && empty && <EmptyDimension />}

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
    </Container>
  )
}

export default Legend
