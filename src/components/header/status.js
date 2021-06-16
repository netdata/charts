import React, { useEffect, useState } from "react"
import styled, { keyframes, css } from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import netdata from "@netdata/netdata-ui/lib/components/icon/assets/netdata.svg"
import reload2 from "@netdata/netdata-ui/lib/components/icon/assets/reload2.svg"
import Icon, { Button } from "@/components/icon"
import Badge from "./badge"

const frames = keyframes`
  from { opacity: 0.2; }
  to { opacity: 1; }
`

const fade = css`
  animation: ${frames} 1.6s ease-in infinite;
`

const Logo = styled(Icon)`
  ${({ isLoading }) => isLoading && fade}
`

const Status = ({ chart, ...rest }) => {
  const [loaded, setLoaded] = useState(chart.getAttribute("loaded"))
  const [delayed, setDelayed] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    return chart.onAttributeChange("loaded", setLoaded)
  }, [])

  const fetch = () => {
    // chart.fetch()
  }

  useEffect(() => chart.on("timeout", setDelayed), [])

  useEffect(
    () => chart.on("successFetch", () => setError(false)).on("failFetch", () => setError(true)),
    []
  )

  return (
    <Flex gap={3} {...rest}>
      <Logo svg={netdata} width="20px" color="primary" isLoading={!loaded} />
      <Button icon={<Icon svg={reload2} />} onClick={fetch} />
      {delayed && <Badge type="warning">Timeout</Badge>}
      {error && <Badge type="error">Error</Badge>}
    </Flex>
  )
}

export default Status
