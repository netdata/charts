import React, { useEffect, useState } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useChart, useInitialLoading, useEmpty } from "@/components/provider"
import Badge from "@/components/badge"
import Logo from "./logo"
import Reload from "./reload"

const Status = props => {
  const chart = useChart()
  const [delayed, setDelayed] = useState(false)
  const [error, setError] = useState(false)
  const initialLoading = useInitialLoading()
  const empty = useEmpty()

  useEffect(() => chart.on("timeout", setDelayed), [])

  useEffect(
    () => chart.on("successFetch", () => setError(false)).on("failFetch", () => setError(true)),
    []
  )

  return (
    <Flex gap={2} data-testid="chartHeaderStatus" {...props}>
      <Flex as={Logo} />
      <Reload />
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
