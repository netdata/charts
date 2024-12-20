import React from "react"
import styled from "styled-components"
import { Box, Flex, Text } from "@netdata/netdata-ui"
import anomalyBadge from "@netdata/netdata-ui/dist/components/icon/assets/anomaly_badge.svg"
import useDebouncedValue from "@netdata/netdata-ui/dist/hooks/useDebouncedValue"
import Icon from "@/components/icon"
import useHover from "@/components/useHover"
import Toolbox from "@/components/toolbox"
import {
  useChart,
  useAttributeValue,
  useTitle,
  useOnResize,
  useDimensionIds,
  useColor,
  useLatestValue,
} from "@/components/provider"
import FilterToolbox from "@/components/filterToolbox"
import { ColorBar } from "@/components/line/dimensions/color"
import Tooltip from "@/components/tooltip"
import Details from "@/components/details"

const Label = styled(Text)`
  line-height: 1;
  font-size: ${({ fontSize }) => fontSize};
`

const ChartHeadWrapper = styled(Flex).attrs(({ size, ...rest }) => ({
  background: "panelBg",
  round: true,
  fontSize: parseInt(size / 3, 10),
  height: "100%",
  width: "100%",
  position: "relative",
  ...rest,
}))`
  font-size: ${props => (props.fontSize > 11 ? 11 : props.fontSize < 8 ? 8 : props.fontSize)}px;
`

export const Title = () => {
  const chart = useChart()
  const title = useTitle()

  const onClick = event => {
    event.preventDefault()
    chart.sdk.trigger("goToLink", chart)
  }

  return (
    <Label
      fontSize="1em"
      textAlign="center"
      color="sectionDescription"
      width="80%"
      onClick={onClick}
      cursor="pointer"
      padding={[2, 0, 0]}
    >
      {title}
    </Label>
  )
}

export const HeadWrapper = ({ children, customChildren, hasFilters = true, ...rest }) => {
  const { width } = useOnResize()
  const focused = useAttributeValue("focused")
  const firstDim = useDimensionIds()?.[0]
  const leftHeaderElements = useAttributeValue("leftHeaderElements")

  let size = width
  size = size < 20 ? 20 : size > 50 ? 50 : size

  const chart = useChart()
  const hoverRef = useHover(
    {
      onHover: chart.focus,
      onBlur: chart.blur,
      isOut: node =>
        !node ||
        (!node.closest(`[data-toolbox="${chart.getId()}"]`) &&
          !node.closest(`[data-chartid="${chart.getId()}"]`)),
    },
    [chart]
  )

  const hasToolbox = useAttributeValue("hasToolbox")
  const showAnomalies = useAttributeValue("showAnomalies")
  const shadowColor = useColor("themeShadow")
  const debouncedFocused = useDebouncedValue(focused, 400)
  const value = useLatestValue("selected", { valueKey: "arp" }) || 0

  return (
    <ChartHeadWrapper size={size} {...rest} ref={hoverRef}>
      {hasToolbox && focused && debouncedFocused && (
        <Toolbox
          position="absolute"
          top="-14px"
          right="0"
          background="mainChartHeaderBg"
          width={{ min: "100%" }}
          padding={[1]}
          sx={{
            boxShadow: `0px 1px 5px 0px ${shadowColor};`,
          }}
          overflow="hidden"
        >
          {hasFilters && width > 400 && (
            <Box width="100%">
              <FilterToolbox border="none" opacity={focused ? 1 : 0.1} focused={focused} />
            </Box>
          )}
        </Toolbox>
      )}
      <Flex column width={5} padding={[1, 0]}>
        {leftHeaderElements.map((Element, index) => (
          <Element key={index} plain />
        ))}
        {width < 400 && (
          <Flex column width={5}>
            <FilterToolbox
              column
              border="none"
              justifyContent="start"
              plain
              opacity={focused ? 1 : 0.1}
              focused={focused}
            />
          </Flex>
        )}
      </Flex>
      <Flex
        column
        alignItems="center"
        justifyContent="center"
        padding={[1, 0]}
        height="100%"
        width="100%"
        position="relative"
        overflow="hidden"
      >
        <Title />
        {children}
      </Flex>
      <Flex column width={5} alignItems="center" padding={[4, 0]} gap={2}>
        {showAnomalies && firstDim === "selected" && (
          <>
            <Flex
              column
              height="100%"
              width="2px"
              background="neutralHighlight"
              justifyContent="end"
            >
              <ColorBar
                id="selected"
                valueKey="arp"
                width="2px"
                styleDimension="height"
                round={0.5}
              />
            </Flex>
            <Tooltip content="Anomaly rate for this metric">
              <Icon
                svg={anomalyBadge}
                color={!!value && value > 0 ? "anomalyTextLite" : "neutralHighlight"}
                size="14px"
              />
            </Tooltip>
          </>
        )}
      </Flex>
      {customChildren}
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
  ({
    count,
    tile = true,
    height = "100%",
    width = "100%",
    children,
    hasFilters = true,
    ...rest
  }) => {
    const showingInfo = useAttributeValue("showingInfo")
    const focused = useAttributeValue("focused")

    const shadowColor = useColor("themeShadow")
    const styles = focused ? { sx: { boxShadow: `0px 1px 5px 0px ${shadowColor};` } } : {}

    return tile ? (
      <HeadWrapper
        count={count}
        uiName={rest.uiName}
        height={height}
        width={width}
        customChildren={children}
        hasFilters={hasFilters}
        {...styles}
      >
        {showingInfo ? <Details /> : <Component {...rest} />}
      </HeadWrapper>
    ) : (
      <ChartHeadWrapper size={20} height={height} width={width} {...styles}>
        {showingInfo ? <Details /> : <Component {...rest} />}
        {children}
      </ChartHeadWrapper>
    )
  }
