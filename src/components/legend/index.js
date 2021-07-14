import React, { useEffect, useState } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
// import { getSizeBy, getRgbColor } from "@netdata/netdata-ui/lib/theme/utils"
// import { webkitVisibleScrollbar } from "@netdata/netdata-ui/lib/mixins/webkit-visible-scrollbar"
import { useInitialLoading, useEmpty, useChart } from "@/components/provider"
import Dimension, { SkeletonDimension, EmptyDimension } from "./dimension"

const Container = styled(Flex).attrs({
  gap: 1,
  overflow: { horizontal: "overlay" },
  padding: [2, 0],
  alignItems: "start",
})`
  ::-webkit-scrollbar {
    height: 6px;
  }
`

const SkeletonDimensions = Array.from(Array(5))

const Legend = props => {
  const chart = useChart()
  const initialLoading = useInitialLoading()
  const empty = useEmpty()
  const getList = () => chart.getDimensionIds()

  const [dimensionIds, setDimensionIds] = useState(getList)

  useEffect(() => chart.on("dimensionChanged", () => setDimensionIds(getList)), [])

  return (
    <Container data-testid="chartLegend" {...props}>
      {!initialLoading && !empty && dimensionIds.map(id => <Dimension key={id} id={id} />)}
      {initialLoading && SkeletonDimensions.map((v, index) => <SkeletonDimension key={index} />)}
      {!initialLoading && empty && <EmptyDimension />}
    </Container>
  )
}

export default Legend
