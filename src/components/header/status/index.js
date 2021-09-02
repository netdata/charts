import React, { useEffect, useState } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useChart, useInitialLoading, useEmpty } from "@/components/provider"
import Badge from "@/components/badge"
import { useHovered } from "@/components/useHover"
import Logo from "./logo"
import Reload from "./reload"

const ReloadContainer = () => {
  const [ref, hovered] = useHovered()

  return <Flex ref={ref}>{hovered ? <Reload /> : <Logo />}</Flex>
}

const Status = props => {
  const chart = useChart()
  const [delayed, setDelayed] = useState(false)
  const [error, setError] = useState(false)
  const initialLoading = useInitialLoading()
  const empty = useEmpty()

  useEffect(() => chart.on("timeout", setDelayed), [chart])

  useEffect(
    () => chart.on("successFetch", () => setError(false)).on("failFetch", () => setError(true)),
    [chart]
  )

  return (
    <Flex gap={2} data-testid="chartHeaderStatus" flex basis="0" {...props}>
      <ReloadContainer />
      {delayed && (
        <Badge type="warning" data-testid="chartHeaderStatus-timeout">
          Timeout
        </Badge>
      )}
      {error && (
        <Badge type="error" data-testid="chartHeaderStatus-error">
          Error
        </Badge>
      )}
      {initialLoading && (
        <Badge type="neutral" data-testid="chartHeaderStatus-loading">
          Loading
        </Badge>
      )}
      {!initialLoading && empty && (
        <Badge type="neutral" data-testid="chartHeaderStatus-empty">
          No data
        </Badge>
      )}
    </Flex>
  )
}

export default Status
