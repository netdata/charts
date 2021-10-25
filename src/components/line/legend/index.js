import React, { memo } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
// import { getSizeBy, getRgbColor } from "@netdata/netdata-ui/lib/theme/utils"
// import { webkitVisibleScrollbar } from "@netdata/netdata-ui/lib/mixins/webkit-visible-scrollbar"
import { useInitialLoading, useEmpty, useDimensionIds, useChart } from "@/components/provider"
import Dimension, { SkeletonDimension, EmptyDimension } from "./dimension"
import { Fragment } from "react"

const Container = styled(Flex).attrs({
  gap: 1,
  padding: [3, 0, 3],
  alignItems: "start",
  flex: true,
  "data-testid": "chartLegend",
})`
  overflow-x: auto; // fallback
  overflow-x: overlay;

  ::-webkit-scrollbar {
    height: 6px;
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

const Dimensions = memo(() => {
  const dimensionIds = useDimensionIds()

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

  return (
    <Container {...props} data-track={chart.track("legend")}>
      {!initialLoading && !empty && <Dimensions />}
      {initialLoading && <SkeletonDimensions />}
      {!initialLoading && empty && <EmptyDimension />}
    </Container>
  )
}

export default Legend
