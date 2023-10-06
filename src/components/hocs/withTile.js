import React from "react"
import styled from "styled-components"
import { useWindowSize } from "react-use"
import { Collapsible, Flex, Text } from "@netdata/netdata-ui"
import anomalyBadge from "@netdata/netdata-ui/lib/components/icon/assets/anomaly_badge.svg"
import Icon from "@/components/icon"
import Status from "@/components/status"
import useHover from "@/components/useHover"
import {
  useChart,
  useAttributeValue,
  useTitle,
  useOnResize,
  useDimensionIds,
} from "@/components/provider"
import FilterToolbox from "@/components/filterToolbox"
import { ColorBar } from "@/components/line/dimensions/color"
import Tooltip from "@/components/tooltip"

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
  ...rest,
}))`
  font-size: ${props => (props.fontSize > 12 ? 12 : props.fontSize < 9 ? 9 : props.fontSize)}px;
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

export const HeadWrapper = ({ children, uiName, ...rest }) => {
  const { parentWidth } = useOnResize()
  const focused = useAttributeValue("focused")
  const firstDim = useDimensionIds()?.[0]

  const { width: windowWidth } = useWindowSize(uiName)
  let size = parseInt((parentWidth || windowWidth) / 30, 10)
  size = size < 20 ? 20 : size > 50 ? 50 : size

  const chart = useChart()
  const hoverRef = useHover(
    {
      onHover: chart.focus,
      onBlur: chart.blur,
      isOut: node =>
        !node || (!node.closest("[data-toolbox]") && !node.closest("[data-testid=chart]")),
    },
    [chart]
  )

  return (
    <ChartHeadWrapper size={size} {...rest} ref={hoverRef}>
      <Flex column width="24px" padding={[2, 1]}>
        <Status plain />
        <Collapsible open={focused} column>
          <FilterToolbox
            column
            background="elementBackground"
            border="none"
            justifyContent="start"
            plain
          />
        </Collapsible>
      </Flex>
      <Flex
        column
        alignItems="center"
        justifyContent="center"
        padding={[1, 0, 2]}
        height="100%"
        width="100%"
        position="relative"
        overflow="hidden"
      >
        <Title />
        {children}
      </Flex>
      <Flex column width="24px" alignItems="center" padding={[4, 1]} gap={2}>
        {firstDim === "selected" && (
          <>
            <Flex
              column
              height="100%"
              width="2px"
              background="nodeBadgeBackground"
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
              <Icon svg={anomalyBadge} color="anomalyTextLite" size="14px" />
            </Tooltip>
          </>
        )}
      </Flex>
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
  ({ count, tile = true, ...rest }) =>
    tile ? (
      <HeadWrapper count={count} uiName={rest.uiName}>
        <Component {...rest} />
      </HeadWrapper>
    ) : (
      <ChartHeadWrapper size={20}>
        <Component {...rest} />
      </ChartHeadWrapper>
    )
