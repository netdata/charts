import React, { useLayoutEffect, useState } from "react"
import styled, { keyframes, css } from "styled-components"
import netdata from "@netdata/netdata-ui/lib/components/icon/assets/netdata.svg"
import Icon from "@/components/icon"

const frames = keyframes`
  from { opacity: 0.4; }
  to { opacity: 1; }
`

const fade = css`
  animation: ${frames} 1.6s ease-in infinite;
`

const StyledIcon = styled(Icon)`
  ${({ isLoading }) => isLoading && fade}
`

const Logo = ({ chart, ...rest }) => {
  const [autofetch, setAutofetch] = useState(chart.getAttribute("autofetch"))

  useLayoutEffect(() => chart.onAttributeChange("autofetch", setAutofetch), [])

  return (
    <StyledIcon
      svg={netdata}
      color="border"
      isLoading={autofetch}
      title={autofetch ? "Playing" : "Paused"}
      data-testid="chartHeaderStatus-logo"
      {...rest}
    />
  )
}

export default Logo
