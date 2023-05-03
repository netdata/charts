import React from "react"
import styled from "styled-components"
import { useWindowSize } from "react-use"
import { Box, Flex, Text } from "@netdata/netdata-ui"
import Status from "@/components/status"
import { useTitle, useOnResize } from "@/components/provider"

const Label = styled(Text)`
  line-height: 1;
  font-size: ${({ fontSize }) => fontSize};
`

const ChartHeadWrapper = styled(Flex).attrs(({ size, ...rest }) => ({
  position: "relative",
  column: true,
  gap: 1,
  padding: [2],
  background: "elementBackground",
  round: true,
  fontSize: parseInt(size / 3, 10),
  ...rest,
}))`
  font-size: ${props => (props.fontSize > 12 ? 12 : props.fontSize)}px;
`

export const Title = () => {
  const title = useTitle()
  return (
    <Flex alignItems="center" justifyContent="center" position="relative" padding={[0, 2.5]}>
      <Box position="absolute" left="-4px" top="-2px">
        <Status plain />
      </Box>
      <Label fontSize="1em" textAlign="center" color="sectionDescription">
        {title}
      </Label>
    </Flex>
  )
}

export const HeadWrapper = ({ children, uiName, ...rest }) => {
  const { parentWidth } = useOnResize()

  const { width: windowWidth } = useWindowSize(uiName)
  let size = parseInt((parentWidth || windowWidth) / 30, 10)
  size = size < 20 ? 20 : size > 50 ? 50 : size

  return (
    <ChartHeadWrapper size={size} {...rest}>
      <Title />
      {children}
    </ChartHeadWrapper>
  )
}

export const ChartWrapper = styled(Flex).attrs(props => ({
  column: true,
  justifyContent: "center",
  alignContent: "center",
  gap: 2,
  position: "relative",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  ...props,
}))``

export default Component =>
  ({ count, ...rest }) =>
    (
      <HeadWrapper count={count} uiName={rest.uiName}>
        <Component {...rest} />
      </HeadWrapper>
    )
