import React from "react"
import styled, { keyframes } from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import { useLoadingColor } from "@/components/provider"
import Icon from "@/components/icon"
import skeletonChart from "./skeleton.svg"

const frames = keyframes`
  from { opacity: 0.2; }
  to { opacity: 0.6; }
`

const SkeletonIcon = styled(Icon).attrs({
  svg: skeletonChart,
  width: "100%",
})`
  animation: ${frames} 1.6s ease-in infinite;
`

const Skeleton = ({ height = "90%", ...rest }) => {
  const color = useLoadingColor()

  return (
    <Flex flex padding={[0, 0, 0, 10]} {...rest}>
      <SkeletonIcon color={color} height={height} />
    </Flex>
  )
}

export default Skeleton
