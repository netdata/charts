import React, { useEffect, useState, useMemo } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useChart, useInitialLoading, useEmpty } from "@/components/provider"
import Badge from "@/components/line/badge"
import { useHovered } from "@/components/useHover"
import Logo from "./logo"
import Reload from "./reload"

const ReloadContainer = () => {
  const [ref, hovered] = useHovered()

  return <Flex ref={ref}>{hovered ? <Reload /> : <Logo />}</Flex>
}

const propsByStatus = {
  delayed: {
    type: "warning",
    children: "Timeout",
    status: "delayed",
  },
  error: {
    type: "error",
    children: "Error",
    status: "error",
  },
  loading: {
    type: "neutral",
    children: "Loading",
    status: "loading",
  },
}

const useStatusProps = ({ initialLoading, error, delayed }) =>
  useMemo(() => {
    if (error) return propsByStatus.error
    if (delayed) return propsByStatus.delayed
    if (initialLoading) return propsByStatus.loading
    return null
  }, [initialLoading, error, delayed])

const StatusBadge = ({ type, status, ...rest }) =>
  type ? <Badge type={type} data-testid={`chartHeaderStatus-${status}`} {...rest} /> : null

const Status = props => {
  const chart = useChart()
  const [delayed, setDelayed] = useState(false)
  const [error, setError] = useState(false)
  const initialLoading = useInitialLoading()
  const empty = useEmpty()

  const statusProps = useStatusProps({ initialLoading, error, delayed })

  useEffect(() => chart.on("timeout", setDelayed), [chart])

  useEffect(
    () => chart.on("successFetch", () => setError(false)).on("failFetch", () => setError(true)),
    [chart]
  )

  return (
    <Flex gap={2} data-testid="chartHeaderStatus" flex basis="0" {...props}>
      <ReloadContainer />
      <StatusBadge {...statusProps} />
      {!initialLoading && empty && (
        <StatusBadge type="neutral" status="empty">
          No data
        </StatusBadge>
      )}
    </Flex>
  )
}

export default Status
