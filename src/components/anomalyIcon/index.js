import React from "react"
import styled, { keyframes } from "styled-components"
import { useLoadingColor } from "@/components/provider"
import Icon from "@/components/icon"
import Tooltip from "@/components/tooltip"
import anomalySVG from "./anomaly.svg"

const frames = keyframes`
  from { opacity: 0.2; }
  to { opacity: 0.6; }
`

const AnomalyIconSVG = styled(Icon).attrs({
  svg: anomalySVG,
  width: "100%",
})`
  animation: ${frames} 1.6s ease-in infinite;
`

const title = "Anomaly bar"

const AnomalyIcon = props => {
  const color = useLoadingColor()

  return (
    <Tooltip content={title}>
      <AnomalyIconSVG color={color} {...props} />
    </Tooltip>
  )
}

export default AnomalyIcon
