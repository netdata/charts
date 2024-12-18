import React from "react"
import { useTheme } from "styled-components"
import { TextBig, TextSmall, Flex, ProgressBar, getColor } from "@netdata/netdata-ui"
import Color, { Color as ColorContainer } from "@/components/line/dimensions/color"
import Name, { Name as NameContainer } from "@/components/line/dimensions/name"
import Value, { Value as ValueContainer } from "@/components/line/dimensions/value"
import { tooltipStyleProps } from "@/components/tooltip"
import Units from "@/components/line/dimensions/units"
import {
  useVisibleDimensionId,
  useChart,
  useLatestValue,
  useUnitSign,
  useIsMinimal,
} from "@/components/provider"
import Tooltip from "@/components/tooltip"
import { useIsHeatmap } from "@/helpers/heatmap"

const DimensionContainer = props => (
  <Flex
    width={{ min: 22, max: 50 }}
    flex={false}
    gap={0.5}
    data-testid="chartLegendDimension"
    {...props}
  />
)

export const SkeletonDimension = () => {
  const theme = useTheme()
  const isMinimal = useIsMinimal()

  return (
    <DimensionContainer>
      <ColorContainer bg={getColor("placeholder")({ theme })} />
      {!isMinimal && (
        <Flex flex gap={1} column overflow="hidden" data-testid="chartLegendDimension-details">
          <Flex height="10px" width="76px" background="borderSecondary" round />
          <Flex
            height="10px"
            width="34px"
            background="borderSecondary"
            round
            data-testid="chartLegendDimension-valueContainer"
          />
        </Flex>
      )}
    </DimensionContainer>
  )
}

export const EmptyDimension = () => {
  const theme = useTheme()
  const isMinimal = useIsMinimal()

  return (
    <DimensionContainer>
      <ColorContainer bg={getColor("placeholder")({ theme })} />
      {!isMinimal && (
        <Flex flex gap={0.5} column overflow="hidden" data-testid="chartLegendDimension-details">
          <NameContainer>No data</NameContainer>
          <ValueContainer>-</ValueContainer>
        </Flex>
      )}
    </DimensionContainer>
  )
}

const AnomalyProgressBar = ({ id }) => {
  const value = useLatestValue(id, { valueKey: "arp" })

  return <ProgressBar height={0.5} color="anomalyText" width={`${Math.abs(value)}%`} />
}

const TooltipContent = props => <Flex {...tooltipStyleProps} {...props} column gap={1} />

const TooltipValue = ({ id, name }) => {
  const units = useUnitSign({ long: true, dimensionId: id, withoutConversion: true })
  const value = useLatestValue(id)

  return (
    <>
      <TextSmall strong wordBreak="break-word">
        {name}
      </TextSmall>
      <TextSmall whiteSpace="nowrap">
        {value} {units}
      </TextSmall>
    </>
  )
}

const Dimension = ({ id, ref }) => {
  const visible = useVisibleDimensionId(id)
  const chart = useChart()

  const name = chart.getDimensionName(id)

  const onClick = e => {
    const merge = e.shiftKey || e.ctrlKey || e.metaKey
    chart.toggleDimensionId(id, { merge })
  }

  const isHeatmap = useIsHeatmap()
  const isMinimal = useIsMinimal()

  return (
    <DimensionContainer
      ref={ref}
      opacity={visible ? null : "weak"}
      cursor="pointer"
      onClick={onClick}
      data-track={chart.track(`dimension-${name}`)}
    >
      {!isHeatmap && <Color id={id} />}
      <Tooltip
        Content={TooltipContent}
        content={visible ? <TooltipValue id={id} name={name} /> : null}
      >
        <Flex flex column overflow="hidden" data-testid="chartLegendDimension-details">
          <Name id={id} noTooltip />

          {!isMinimal && <AnomalyProgressBar id={id} />}

          {!isMinimal && (
            <Flex gap={1} alignItems="end" data-testid="chartLegendDimension-valueContainer" flex>
              <Value id={id} strong visible={visible} Component={TextBig} />
              <Units visible={visible} dimensionId={id} />
            </Flex>
          )}
        </Flex>
      </Tooltip>
    </DimensionContainer>
  )
}

export default Dimension
