import React from "react"
import { Flex } from "@netdata/netdata-ui"
import Color from "@/components/line/dimensions/color"
import Name from "@/components/line/dimensions/name"
import Value from "@/components/line/dimensions/value"
import { useVisibleDimensionId } from "@/components/provider"

const Dimension = ({ id, strong, chars }) => {
  const visible = useVisibleDimensionId(id)

  return (
    <Flex
      data-testid="chartPopover-dimension"
      alignItems="center"
      opacity={visible ? null : "weak"}
      gap={3}
      justifyItems="between"
    >
      <Flex alignItems="center" gap={1} flex>
        <Color id={id} height="12px" />
        <Name flex id={id} strong={strong} maxLength={chars} />
      </Flex>
      <Flex gap={2} basis="80px" justifyContent="end">
        <Flex>
          <Value id={id} strong={strong} visible={visible} />
        </Flex>
        <Flex basis="30px" justifyContent="end" padding={[0, 3, 0, 0]}>
          <Value
            id={id}
            strong={strong}
            visible={visible}
            valueKey="ar"
            color={["purple", "lilac"]}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}

export default Dimension
