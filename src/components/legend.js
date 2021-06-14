import React, { useEffect, useMemo, useState } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import LegendColor from "./legendColor"
import LegendName from "./legendName"
import DimensionValue from "./dimensionValue"

const Dimension = ({ chart, id }) => {
  return (
    <Flex width="88px" gap={1}>
      <LegendColor chart={chart} id={id} />
      <Flex flex column overflow="hidden">
        <LegendName chart={chart} id={id} />
        <DimensionValue chart={chart} id={id} />
      </Flex>
    </Flex>
  )
}

const Legend = ({ chart, ...rest }) => {
  const getList = () => chart.getDimensionIds()

  const [dimensionIds, setDimensionIds] = useState(getList)

  useEffect(() => {
    const off = chart.on("dimensionChanged", () => {
      setDimensionIds(getList)
    })

    return () => {
      off()
    }
  }, [])

  return (
    <Flex
      gap={1}
      overflow={{ horizontal: "auto" }}
      border={{ side: "top", color: "borderSecondary" }}
      padding={[3, 0]}
      {...rest}
    >
      {dimensionIds.map(id => (
        <Dimension key={id} chart={chart} id={id} />
      ))}
    </Flex>
  )
}

export default Legend
