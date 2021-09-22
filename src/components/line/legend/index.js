import React, { useEffect, useState } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
// import { getSizeBy, getRgbColor } from "@netdata/netdata-ui/lib/theme/utils"
// import { webkitVisibleScrollbar } from "@netdata/netdata-ui/lib/mixins/webkit-visible-scrollbar"
import { useInitialLoading, useEmpty, useDimensionIds } from "@/components/provider"
import Dimension, { SkeletonDimension, EmptyDimension } from "./dimension"
import { Fragment } from "react"

const Container = styled(Flex).attrs({
  gap: 1,
  overflow: { horizontal: "overlay" },
  padding: [3, 0, 3],
  alignItems: "start",
  flex: true,
  "data-testid": "chartLegend",
})`
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

const Dimensions = () => {
  const dimensionIds = useDimensionIds()

  return (
    <Fragment>
      {dimensionIds.map(id => (
        <Dimension key={id} id={id} />
      ))}
    </Fragment>
  )
}
const Legend = props => {
  const initialLoading = useInitialLoading()
  const empty = useEmpty()

  return (
    <Container {...props}>
      {!initialLoading && !empty && <Dimensions />}
      {initialLoading && <SkeletonDimensions />}
      {!initialLoading && empty && <EmptyDimension />}
    </Container>
  )
}

export default Legend
