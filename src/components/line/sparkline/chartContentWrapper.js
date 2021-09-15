import React from "react"
import { useEmpty, useInitialLoading } from "@/components/provider"
import ChartContainer from "@/components/chartContainer"
import Skeleton from "@/components/line/skeleton"
import { Container } from "@/components/line/chartContentWrapper"

const ChartContentWrapper = () => {
  const initialLoading = useInitialLoading()
  const empty = useEmpty()

  return (
    <Container padding={[0]}>
      {!initialLoading && !empty && <ChartContainer />}
      {initialLoading && <Skeleton padding={[0]} height="100%" />}
    </Container>
  )
}

export default ChartContentWrapper
