import React, { useMemo, useState } from "react"
import { Flex, Text, TextSmall, Button } from "@netdata/netdata-ui"
import { Color } from "@/components/line/dimensions/color"
import makeDefaultSDK from "./makeDefaultSDK"

const baseDimensions = ["cpu", "memory", "disk", "network"]

const lateCustomColors = {
  load: "#FF0000",
  iops: "#00AA00",
  latency: "#0000FF",
  errors: "#FF9900",
  saturation: "#AA00AA",
}

const Swatch = ({ chart, id }) => (
  <Flex gap={2} alignItems="center">
    <Color bg={chart.selectDimensionColor(id)} width="16px" height="16px" />
    <TextSmall>{id}</TextSmall>
    <TextSmall color="textLite">{chart.selectDimensionColor(id)}</TextSmall>
  </Flex>
)

export const LateArrivingCustomColors = ({ theme }) => {
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK({ attributes: { theme } })
    const instance = sdk.makeChart({ attributes: { id: "perDimensionColors", colors: {} } })
    sdk.appendChild(instance)
    baseDimensions.forEach(id => instance.selectDimensionColor(id))
    return instance
  }, [theme])

  const [dimensions, setDimensions] = useState(baseDimensions)

  const bringInCustomDimensions = () => {
    chart.updateAttribute("colors", lateCustomColors)
    setDimensions([...baseDimensions, ...Object.keys(lateCustomColors)])
  }

  return (
    <Flex column gap={4} padding={[4]} background="mainBackground">
      <Text>
        Base dimensions get auto-assigned palette colors. Click the button to bring in new
        dimensions that each carry their own custom color, keyed by name.
      </Text>
      <Button label="Bring in custom-colored dimensions" onClick={bringInCustomDimensions} />
      <Flex column gap={2}>
        {dimensions.map(id => (
          <Swatch key={id} chart={chart} id={id} />
        ))}
      </Flex>
    </Flex>
  )
}

export default {
  title: "Per-dimension colors",
  component: LateArrivingCustomColors,
  args: {
    theme: "default",
  },
  argTypes: {
    theme: {
      control: { type: "select" },
      options: ["default", "dark"],
    },
  },
}
