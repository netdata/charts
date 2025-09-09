import React from "react"
import { Flex, TextSmall, TextMicro, Icon, Button } from "@netdata/netdata-ui"
import { useChart, useAttributeValue } from "@/components/provider"
import Sparkline from "./sparkline"

const getWeightColor = weight => {
  const absWeight = Math.abs(weight)
  if (absWeight >= 0.8) return "primary"
  if (absWeight >= 0.5) return "warning"
  if (absWeight >= 0.2) return "textLite"
  return "textDescription"
}

const formatWeight = weight => {
  const correlationStrength = (1 - weight) * 100
  return correlationStrength.toFixed(1) + "%"
}

const formatChange = change => {
  const sign = change > 0 ? "+" : ""
  return sign + change.toFixed(1) + "%"
}

const DimensionRow = ({ dimension, contextName }) => {
  const weightColor = getWeightColor(dimension.correlationWeight)
  const changeColor =
    dimension.percentChange > 0 ? "warning" : dimension.percentChange < 0 ? "primary" : "textLite"

  return (
    <Flex
      justifyContent="between"
      alignItems="center"
      padding={[1, 2]}
      background="mainChartBg"
      round
    >
      <Flex column gap={0.5} flex={1}>
        <TextSmall
          title={`Metric: ${dimension.dimensionName}\nContext: ${dimension.context}\nNode: ${dimension.nodeName}`}
        >
          {dimension.dimensionName}
        </TextSmall>
        <TextMicro color="textDescription">
          {dimension.nodeName} • {dimension.context}
        </TextMicro>
      </Flex>

      <Flex gap={2} alignItems="center">
        <Flex
          column
          alignItems="end"
          gap={0.5}
          title={`Correlation strength: ${formatWeight(dimension.correlationWeight)}\nHigher values indicate stronger correlation.\n100% = perfect correlation, 0% = no correlation`}
        >
          <TextSmall color={weightColor}>{formatWeight(dimension.correlationWeight)}</TextSmall>
          <TextMicro color="textDescription">{dimension.correlationStrength}</TextMicro>
        </Flex>

        <Flex
          column
          alignItems="end"
          gap={0.5}
          title={`Percent change: ${formatChange(dimension.percentChange)}\nChange in average value between baseline period and selected period.\nPositive = increased, Negative = decreased`}
        >
          <TextSmall color={changeColor}>{formatChange(dimension.percentChange)}</TextSmall>
          <TextMicro color="textDescription">Change</TextMicro>
        </Flex>

        <Flex width="120px">
          <Sparkline dimension={dimension} contextName={contextName} />
        </Flex>
      </Flex>
    </Flex>
  )
}

const ContextRow = ({ contextGroup, isExpanded, onToggle }) => {
  const weightColor = getWeightColor(contextGroup.minWeight)

  return (
    <Flex column gap={1}>
      <Flex
        justifyContent="between"
        alignItems="center"
        padding={[2]}
        onClick={onToggle}
        cursor="pointer"
        border="bottom"
      >
        <Flex alignItems="center" gap={1}>
          <Icon
            name={isExpanded ? "chevron_down" : "chevron_right"}
            color="textDescription"
            size="small"
          />
          <Flex column gap={0.5}>
            <TextSmall strong>{contextGroup.contextName}</TextSmall>
            <TextMicro color="textDescription">
              {contextGroup.count} correlated dimensions
            </TextMicro>
          </Flex>
        </Flex>

        <Flex gap={2} alignItems="center">
          <Flex
            column
            alignItems="end"
            gap={0.5}
            title={`Strongest correlation in this context: ${formatWeight(contextGroup.minWeight)}\nShows the most correlated metric within this context.\nClick to expand and see all correlated dimensions.`}
          >
            <TextSmall color={weightColor}>{formatWeight(contextGroup.minWeight)}</TextSmall>
          </Flex>
        </Flex>
      </Flex>

      {isExpanded && (
        <Flex column gap={1} padding={[0, 0, 1, 0]}>
          {contextGroup.dimensions.map(dimension => (
            <DimensionRow
              key={`${dimension.dimension}-${dimension.nodeId}`}
              dimension={dimension}
              contextName={contextGroup.context}
            />
          ))}
        </Flex>
      )}
    </Flex>
  )
}

const Table = ({ data }) => {
  const chart = useChart()
  const expandedContexts = useAttributeValue("correlate.expandedContexts", [])

  const toggleContext = context => {
    const isExpanded = expandedContexts.includes(context)
    const newExpanded = isExpanded
      ? expandedContexts.filter(ctx => ctx !== context)
      : [...expandedContexts, context]

    chart.updateAttribute("correlate.expandedContexts", newExpanded)
  }

  if (!data || data.length === 0) {
    return (
      <Flex justifyContent="center" padding={[4, 0]}>
        <TextSmall color="textLite">No correlations found</TextSmall>
      </Flex>
    )
  }

  return (
    <Flex column gap={2}>
      <Flex justifyContent="between" alignItems="center" padding={[1, 0]}>
        <TextSmall color="textDescription">
          Found {data.reduce((sum, ctx) => sum + ctx.count, 0)} correlated dimensions across{" "}
          {data.length} contexts
        </TextSmall>
        <Button
          tiny
          neutral
          label={expandedContexts.length === data.length ? "Collapse all" : "Expand all"}
          onClick={() => {
            const allExpanded = expandedContexts.length === data.length
            chart.updateAttribute(
              "correlate.expandedContexts",
              allExpanded ? [] : data.map(ctx => ctx.context)
            )
          }}
        />
      </Flex>

      {data.map(contextGroup => (
        <ContextRow
          key={contextGroup.context}
          contextGroup={contextGroup}
          isExpanded={expandedContexts.includes(contextGroup.context)}
          onToggle={() => toggleContext(contextGroup.context)}
        />
      ))}
    </Flex>
  )
}

export default Table
