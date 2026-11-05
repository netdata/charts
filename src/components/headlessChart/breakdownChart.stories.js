import React from "react"
import { Flex, Text } from "@netdata/netdata-ui"
import makeDefaultSDK from "../../makeDefaultSDK"
import useGroupedChart from "./useGroupedChart"
import BreakdownChart from "./breakdownChart"
import HeadlessChart from "."

const DefaultGaugeBreakdown = ({ host, ...args }) => {
  const sdk = makeDefaultSDK({ attributes: { theme: "default", containerWidth: 1000 } })

  return (
    <Flex background="mainBackground" padding={[4]} height="100vh" column gap={4}>
      <Text variant="h6">Gauge Breakdown — Default Rendering</Text>
      <BreakdownChart
        sdk={sdk}
        contextScope={["httpcheck.responsetime"]}
        host={host}
        agent={true}
        chartLibrary="gauge"
        groupBy={["instance"]}
        {...args}
      />
    </Flex>
  )
}

const CustomGauges = () => {
  const { groups, state } = useGroupedChart()

  if (state.loading && !state.loaded) {
    return <Text>Loading groups...</Text>
  }

  if (!groups.length) {
    return <Text>No groups found</Text>
  }

  return (
    <Flex flexWrap gap={4}>
      {groups.map(group => (
        <Flex
          key={group.key}
          column
          alignItems="center"
          gap={2}
          padding={[4]}
          border={{ color: "borderSecondary", side: "all" }}
          round={2}
          basis="250px"
        >
          <Text strong>{group.label}</Text>
          <Flex
            justifyContent="center"
            alignItems="center"
            width="100px"
            height="100px"
            round="100%"
            border={{ color: "primary", side: "all", size: "4px" }}
          >
            <Text variant="h4" strong color="primary">
              {Math.round(group.value)}
            </Text>
          </Flex>
          <Text variant="caption" color="textSecondary">
            {group.dimensions.length} dimension{group.dimensions.length !== 1 ? "s" : ""}
          </Text>
          <Flex column gap={1}>
            {group.dimensions.map(dim => (
              <Flex key={dim.id} alignItems="center" gap={1}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: dim.color,
                    borderRadius: 2,
                  }}
                />
                <Text variant="caption">
                  {dim.name}: {dim.convertedValue}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Flex>
      ))}
    </Flex>
  )
}

const WithRenderFunctionStory = ({ host, ...args }) => {
  const sdk = makeDefaultSDK({ attributes: { theme: "default", containerWidth: 1000 } })

  return (
    <Flex background="mainBackground" padding={[4]} height="100vh" column gap={4}>
      <Text variant="h6">Gauge Breakdown — Custom Render Function</Text>
      <BreakdownChart
        sdk={sdk}
        contextScope={["httpcheck.responsetime"]}
        host={host}
        agent={true}
        chartLibrary="gauge"
        groupBy={["instance"]}
        renderFunction={(groups, { state }) => {
          if (state.loading && !state.loaded) return <Text>Loading...</Text>
          if (!groups.length) return <Text>No groups</Text>

          return (
            <Flex flexWrap gap={3}>
              {groups.map(group => (
                <Flex
                  key={group.key}
                  padding={[3]}
                  background="backgroundSecondary"
                  round={1}
                  column
                  gap={1}
                  basis="200px"
                >
                  <Text strong>{group.label}</Text>
                  <Text variant="h3" color="primary">
                    {Math.round(group.value)} ms
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    Range: {Math.round(group.min)} - {Math.round(group.max)}
                  </Text>
                </Flex>
              ))}
            </Flex>
          )
        }}
        {...args}
      />
    </Flex>
  )
}

const PieBreakdownStory = ({ host, ...args }) => {
  const sdk = makeDefaultSDK({ attributes: { theme: "default", containerWidth: 1000 } })

  return (
    <Flex background="mainBackground" padding={[4]} height="100vh" column gap={4}>
      <Text variant="h6">Pie Breakdown — Default Rendering</Text>
      <BreakdownChart
        sdk={sdk}
        contextScope={["httpcheck.responsetime"]}
        host={host}
        agent={true}
        chartLibrary="d3pie"
        groupBy={["instance"]}
        {...args}
      />
    </Flex>
  )
}

const HeadlessWithGroupedHook = ({ host, ...args }) => {
  const sdk = makeDefaultSDK({ attributes: { theme: "default", containerWidth: 1000 } })

  return (
    <Flex background="mainBackground" padding={[4]} height="100vh" column gap={4}>
      <Text variant="h6">HeadlessChart + useGroupedChart Hook</Text>
      <HeadlessChart
        sdk={sdk}
        contextScope={["httpcheck.responsetime"]}
        host={host}
        agent={true}
        chartLibrary="gauge"
        groupBy={["instance"]}
        {...args}
      >
        <CustomGauges />
      </HeadlessChart>
    </Flex>
  )
}

export const Default = DefaultGaugeBreakdown
export const WithRenderFunction = WithRenderFunctionStory
export const PieBreakdown = PieBreakdownStory
export const WithHook = HeadlessWithGroupedHook

export default {
  title: "BreakdownChart",
  component: BreakdownChart,
  tags: ["autodocs"],
  args: {
    host: "http://10.10.11.51:19999/api/v3",
  },
  argTypes: {
    host: {
      control: { type: "text" },
      description: "API endpoint for data fetching",
    },
  },
}
