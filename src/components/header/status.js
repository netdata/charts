import React, { useEffect, useState } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useInitialLoading } from "@/components/useAttribute"
import Badge from "./badge"
import Logo from "./logo"
import Reload from "./reload"

const Status = ({ chart, ...rest }) => {
  const [delayed, setDelayed] = useState(false)
  const [error, setError] = useState(false)
  const initialLoading = useInitialLoading(chart)

  useEffect(() => chart.on("timeout", setDelayed), [])

  useEffect(
    () => chart.on("successFetch", () => setError(false)).on("failFetch", () => setError(true)),
    []
  )

  return (
    <Flex gap={3} data-testid="chartHeaderStatus" {...rest}>
      <Logo chart={chart} />
      <Reload chart={chart} />
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
    </Flex>
  )
}

export default Status
