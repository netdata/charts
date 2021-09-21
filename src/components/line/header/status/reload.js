import React, { useState } from "react"
import styled, { keyframes, css } from "styled-components"
import reload2 from "@netdata/netdata-ui/lib/components/icon/assets/reload2.svg"
import Icon, { Button } from "@/components/icon"
import { useChart } from "@/components/provider"

const frames = keyframes`
  from { transform: rotate(360deg); }
  to { transform: rotate(0); }
`

const fade = css`
  animation: ${frames} 1.6s ease-in infinite;
`

const StyledIcon = styled(Icon)`
  ${({ isLoading }) => isLoading && fade}
`

const Reload = props => {
  const chart = useChart()
  const [loading, setLoading] = useState(false)

  const fetch = () => {
    setLoading(true)
    chart.fetch().finally(() => setLoading(false))
  }

  return (
    <Button
      icon={<StyledIcon svg={reload2} isLoading={loading} />}
      disabled={loading}
      onClick={fetch}
      title="Refresh"
      data-testid="chartHeaderStatus-reload"
      tooltipProps={{ open: true }}
      {...props}
    />
  )
}

export default Reload
