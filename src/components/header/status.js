import React, { useEffect, useState } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useInitialLoading, useEmpty } from "@/components/useAttribute"
import Badge from "./badge"
import Logo from "./logo"
import Reload from "./reload"

const Status = ({ chart, ...rest }) => {
  const [delayed, setDelayed] = useState(false)
  const [error, setError] = useState(false)
  const initialLoading = useInitialLoading(chart)
  const empty = useEmpty(chart)

  useEffect(() => chart.on("timeout", setDelayed), [])

  useEffect(
    () => chart.on("successFetch", () => setError(false)).on("failFetch", () => setError(true)),
    []
  )

  return (
    <Flex data-testid="chartHeaderStatus" {...rest}>
      <Flex as={Logo} padding={[0.5, 0.5, 0]} chart={chart} />
      <Reload chart={chart} />
      {delayed && (
        <Badge type="warning" margin={[0, 0, 0, 1]} data-testid="chartHeaderStatus-timeout">
          Timeout
        </Badge>
      )}
      {error && (
        <Badge type="error" margin={[0, 0, 0, 1]} data-testid="chartHeaderStatus-error">
          Error
        </Badge>
      )}
      {initialLoading && (
        <Badge type="neutral" margin={[0, 0, 0, 1]} data-testid="chartHeaderStatus-loading">
          Loading
        </Badge>
      )}
      {!initialLoading && empty && (
        <Badge type="neutral" margin={[0, 0, 0, 1]} data-testid="chartHeaderStatus-empty">
          No data
        </Badge>
      )}
    </Flex>
  )
}

export default Status
