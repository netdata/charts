import React, { useEffect, useState } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { getSizeBy } from "@netdata/netdata-ui/lib/theme/utils"
import { webkitVisibleScrollbar } from "@netdata/netdata-ui/lib/mixins/webkit-visible-scrollbar"
import { useInitialLoading } from "@/components/useAttribute"
import Dimension, { SkeletonDimension } from "./dimension"

const Container = styled(Flex).attrs({
  gap: 1,
  overflow: { horizontal: "auto" },
  padding: [3, 0, 1],
  alignItems: "start",
})`
  ${webkitVisibleScrollbar}

  &::-webkit-scrollbar {
    height: ${getSizeBy(1)};
  }
`

const SkeletonDimensions = Array.from(Array(5))

const Legend = ({ chart, ...rest }) => {
  const initialLoading = useInitialLoading(chart)
  const getList = () => chart.getDimensionIds()

  const [dimensionIds, setDimensionIds] = useState(getList)

  useEffect(() => chart.on("dimensionChanged", () => setDimensionIds(getList)), [])

  return (
    <Container data-testid="chartLegend" {...rest}>
      {!initialLoading && dimensionIds.map(id => <Dimension key={id} chart={chart} id={id} />)}
      {initialLoading && SkeletonDimensions.map((v, index) => <SkeletonDimension key={index} />)}
    </Container>
  )
}

export default Legend
