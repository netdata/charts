import React from "react"
import styled from "styled-components"
import { Box, Flex, getColor } from "@netdata/netdata-ui"
import { useAttribute, useAttributeValue, useChart } from "@/components/provider"
import makeLog from "@/sdk/makeLog"
import { radius } from "./tokens"

const modes = [
  { value: "pan", label: "Pan", title: "Drag to pan", track: "pan" },
  {
    value: "select",
    label: "Zoom",
    title: "Drag to zoom (Shift+drag)",
    track: "selectHorizontal",
  },
  {
    value: "highlight",
    label: "Highlight",
    title: "Drag to highlight without zooming (Alt+drag)",
    track: "highlight",
  },
  {
    value: "selectVertical",
    label: "Vertical",
    title: "Drag to zoom vertically (Alt+Shift+drag)",
    track: "selectVertical",
  },
]

const Segment = styled(Box).attrs(({ isActive }) => ({
  as: "button",
  border: { side: "all", color: isActive ? "segmentedBorder" : "inputBorder" },
  round: radius.control,
  padding: [1, 0],
  cursor: "pointer",
}))`
  flex: 1;
  background: ${({ isActive, theme }) =>
    isActive ? getColor("controlPressedBackground")({ theme }) : "transparent"};
  font-family: inherit;
  font-size: 11.5px;
  color: ${getColor("text")};
`

const NavigationModes = () => {
  const chart = useChart()
  const enabled = useAttributeValue("enabledNavigation")
  const [navigation, setNavigation] = useAttribute("navigation")

  if (!enabled) return null

  return (
    <Flex gap={1} padding={[0.5, 2.5, 1.5]} role="group" aria-label="Navigation">
      {modes.map(({ value, label, title, track }) => (
        <Segment
          key={value}
          type="button"
          title={title}
          isActive={navigation === value}
          aria-pressed={navigation === value}
          data-testid={`chartMore-navigation-${value}`}
          data-track={chart.track(track)}
          onClick={() => {
            setNavigation(value)
            makeLog(chart)({ chartAction: `chart-toolbox-${value}` })
          }}
        >
          {label}
        </Segment>
      ))}
    </Flex>
  )
}

export default NavigationModes
