import React from "react"
import styled from "styled-components"
import { useWindowSize } from "react-use"
import { Box, Flex, Text } from "@netdata/netdata-ui"
import Status from "@/components/status"
import { useAttributeValue, useTitle } from "@/components/provider"

const Label = styled(Text)`
  line-height: 1;
  font-size: ${({ fontSize }) => fontSize};
`

const ChartHeadWrapper = styled(Flex).attrs(({ size, chartLibrary, ...rest }) => {
  const gutter = parseInt(size / 20, 10)

  return {
    position: "relative",
    column: true,
    gap: 1,
    padding: [2],
    background: "elementBackground",
    round: true,
    height: size,
    margin: [0, gutter, gutter, 0],
    flex: chartLibrary === "gauge" ? 2 : 1,
    fontSize: parseInt(size / 3, 10),
    width: size,
    ...rest,
  }
})`
  max-height: 190px;
  max-width: ${props => props.size * 4 * 2}px;
  font-size: ${props => (props.fontSize < 11 ? 11 : props.fontSize > 12 ? 12 : props.fontSize)}px;
`

export const Title = () => {
  const title = useTitle()
  return (
    <Flex alignItems="center" justifyContent="center" position="relative">
      <Box position="absolute" left={0}>
        <Status />
      </Box>
      <Label fontSize="1em" textAlign="center" color="sectionDescription">
        {title}
      </Label>
    </Flex>
  )
}

export const HeadWrapper = ({ children, parentWidth, ...rest }) => {
  const chartLibrary = useAttributeValue("chartLibrary")

  const { width: windowWidth } = useWindowSize()
  let size = parseInt((parentWidth || windowWidth) / 30, 10)
  size = size < 20 ? 20 : size > 50 ? 50 : size

  return (
    <ChartHeadWrapper size={size} {...rest} chartLibrary={chartLibrary}>
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
  ({ parentWidth, count, ...rest }) =>
    (
      <HeadWrapper parentWidth={parentWidth} count={count}>
        <Component {...rest} />
      </HeadWrapper>
    )
