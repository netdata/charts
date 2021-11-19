import React from "react"
import { useInitialLoading, useEmpty } from "@/components/provider"
import ChartContainer from "@/components/chartContainer"
import { CenterNoData } from "@/components/line/overlays/proceeded"
import Tooltip from "@/components/line/popover"
import Skeleton from "@/components/line/skeleton"
import Overlays from "@/components/line/overlays"
import { Container } from "@/components/line/chartContentWrapper"

const ChartContentWrapper = () => {
  const initialLoading = useInitialLoading()
  const empty = useEmpty()

  return (
    <Container>
      {!initialLoading && !empty && <ChartContainer />}
      {!initialLoading && !empty && <Overlays />}
      {!initialLoading && empty && <CenterNoData />}
      {initialLoading && <Skeleton />}
      <Tooltip />
    </Container>
  )
}

export default ChartContentWrapper
