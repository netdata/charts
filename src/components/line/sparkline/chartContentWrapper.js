import React from "react"
import { useEmpty, useInitialLoading } from "@/components/provider"
import ChartContainer from "@/components/chartContainer"
import Skeleton from "@/components/line/skeleton"
import { Container } from "@/components/line/chartContentWrapper"
import Overlays from "@/components/line/overlays"
import { CenterNoData } from "@/components/line/overlays/proceeded"

const ChartContentWrapper = () => {
  const initialLoading = useInitialLoading()
  const empty = useEmpty()

  return (
    <Container padding={[0]}>
      {!initialLoading && !empty && <ChartContainer />}
      {!initialLoading && !empty && <Overlays />}
      {!initialLoading && empty && <CenterNoData />}
      {initialLoading && <Skeleton padding={[0]} height="100%" />}
    </Container>
  )
}

export default ChartContentWrapper
