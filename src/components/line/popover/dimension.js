import React from "react"
import { TextMicro, Flex } from "@netdata/netdata-ui"
import Color from "@/components/line/dimensions/color"
import Name from "@/components/line/dimensions/name"
import Value from "@/components/line/dimensions/value"
import Units, { Value as Unit } from "@/components/line/dimensions/units"
import { useVisibleDimensionId } from "@/components/provider"

const Dimension = ({ id, strong, chars }) => {
  const visible = useVisibleDimensionId(id)

  return (
    <Flex
      gap={1}
      data-testid="chartPopover-dimension"
      alignItems="center"
      opacity={visible ? null : "weak"}
    >
      <Color id={id} height="12px" />
      <Name flex id={id} strong={strong} maxLength={chars} />
      <Value id={id} strong={strong} visible={visible} />
      <Units visible={visible} />
      <Value
        id={id}
        strong={strong}
        visible={visible}
        resultKey="anomalyResult"
        color={["purple", "lilac"]}
      />
      <Unit color={["purple", "lilac"]}>%</Unit>
    </Flex>
  )
}

export default Dimension
