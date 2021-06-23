import React, { useMemo } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import LegendColor from "./legendColor"
import LegendName from "./legendName"
import DimensionValue from "./dimensionValue"

const Dimension = ({ chart, index }) => {
  return (
    <Flex width="88px" gap={1}>
      <LegendColor chart={chart} index={index} />
      <Flex column overflow="hidden">
        <LegendName chart={chart} index={index} />
        <DimensionValue chart={chart} index={index} />
      </Flex>
    </Flex>
  )
}

const Legend = ({ chart }) => {
  const { dimensionIds } = chart.getPayload()
  const list = useMemo(() => [...Array(Math.min(10, dimensionIds.length))], [dimensionIds.length])

  return (
    <Flex gap={1} overflow={{ horizontal: "auto" }}>
      {list.map((v, index) => (
        <Dimension key={dimensionIds[index]} chart={chart} index={index} />
      ))}
    </Flex>
  )
}

export default Legend
