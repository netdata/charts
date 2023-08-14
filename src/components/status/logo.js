import React from "react"
import styled, { keyframes, css } from "styled-components"
import { getColor } from "@netdata/netdata-ui/lib/theme/utils"
import loading from "@netdata/netdata-ui/lib/components/icon/assets/loading.svg"
import { useIsFetching, useLoadingColor } from "@/components/provider"
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
  stroke: ${({ strokeColor, theme }) => getColor(strokeColor)({ theme })};
  stroke-width: 2;
  ${({ isFetching }) => isFetching && animation}
`

const Logo = props => {
  const isFetching = useIsFetching()
  const color = useLoadingColor("border")

  return (
    <StyledIcon
      svg={loading}
      color="mainBackground"
      strokeColor={color}
      isFetching={isFetching}
      title={isFetching ? "Playing" : "Paused"}
      data-testid="chartHeaderStatus-logo"
      size="16px"
      {...props}
    />
  )
}

export default Logo
