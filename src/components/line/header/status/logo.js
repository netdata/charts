import React from "react"
import styled, { keyframes, css } from "styled-components"
import loading from "@netdata/netdata-ui/lib/components/icon/assets/loading.svg"
import { useIsFetching } from "@/components/provider"
import Icon from "@/components/icon"

const frames = keyframes`
  0% {
    stroke-dashoffset: 100;
  }
  100% {
    stroke-dashoffset: 0;
  }
  `

const animation = css`
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: ${frames} 1000ms linear forwards;
  animation-delay: 0s;
  animation-iteration-count: infinite;
  -webkit-backface-visibility: hidden;
  opacity: 1;
  visibility: visible;
`

const StyledIcon = styled(Icon)`
  ${({ isFetching }) => isFetching && animation}
`

const Logo = props => {
  const isFetching = useIsFetching()

  return (
    <StyledIcon
      svg={loading}
      color="mainBackground"
      isFetching={isFetching}
      title={isFetching ? "Playing" : "Paused"}
      data-testid="chartHeaderStatus-logo"
      {...props}
    />
  )
}

export default Logo
