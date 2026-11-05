import React from "react"
import { Flex, TextSmall } from "@netdata/netdata-ui"
import HeadlessChart from "."
import useGroupedChart from "./useGroupedChart"

const DefaultGroupRenderer = ({ groups }) => (
  <Flex flexWrap gap={2}>
    {groups.map(group => (
      <Flex key={group.key} column alignItems="center" gap={1} basis="200px">
        <TextSmall>{group.label}</TextSmall>
        <Flex height="150px" width="200px" justifyContent="center" alignItems="center">
          <TextSmall strong>{Math.round(group.value)}</TextSmall>
        </Flex>
      </Flex>
    ))}
  </Flex>
)

const GroupedRenderer = ({ renderFunction, sharedMinMax }) => {
  const { groups, chart, helpers, state } = useGroupedChart({ sharedMinMax })

  if (renderFunction) {
    return renderFunction(groups, { chart, helpers, state })
  }

  return <DefaultGroupRenderer groups={groups} />
}

const BreakdownChart = ({
  renderFunction,
  sharedMinMax,
  children,
  ...headlessChartProps
}) => (
  <HeadlessChart {...headlessChartProps}>
    {children || (
      <GroupedRenderer
        renderFunction={renderFunction}
        sharedMinMax={sharedMinMax}
      />
    )}
  </HeadlessChart>
)

export default BreakdownChart
