import React, { useMemo } from "react"
import { Flex } from "@netdata/netdata-ui"
import { useInitialLoading, useEmpty, useChartError } from "@/components/provider"
import Badge from "@/components/line/badge"
import { useHovered } from "@/components/useHover"
import Logo from "./logo"
import Reload from "./reload"

const ReloadContainer = () => {
  const [ref, hovered] = useHovered()

  return <Flex ref={ref}>{hovered ? <Reload /> : <Logo />}</Flex>
}

const propsByStatus = {
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

const useStatusProps = ({ initialLoading, error }) =>
  useMemo(() => {
    if (error)
      return { ...propsByStatus.error, children: `${propsByStatus.error.children}: ${error}` }
    if (initialLoading) return propsByStatus.loading
    return null
  }, [initialLoading, error])

const StatusBadge = ({ type, status, ...rest }) =>
  type ? <Badge type={type} data-testid={`chartHeaderStatus-${status}`} {...rest} /> : null

const Status = ({ plain, ...rest }) => {
  const initialLoading = useInitialLoading()
  const empty = useEmpty()
  const error = useChartError()
  const statusProps = useStatusProps({ initialLoading, error })

  return (
    <Flex gap={2} data-testid="chartHeaderStatus" basis="0" {...rest}>
      <ReloadContainer />
      {!plain && <StatusBadge {...statusProps} />}
      {!plain && !initialLoading && empty && !statusProps && (
        <StatusBadge type="neutral" status="empty">
          No data
        </StatusBadge>
      )}
    </Flex>
  )
}

export default Status
