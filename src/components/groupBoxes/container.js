import React, { useState, forwardRef } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useChart, useMetadata, useListener } from "@/components/provider"
import GroupBoxes from "./groupBoxes"
import Legend from "./legend"

const useGroupBoxLayout = () => {
  const chart = useChart()

  const getValue = () => chart.getUI().getGroupBoxLayout()
  const [value, setValue] = useState(getValue)

  useListener(() => chart.getUI().on("groupBoxLayoutChanged", () => setValue(getValue)), [chart])

  return value
}

const Container = forwardRef(({ renderBoxPopover, renderGroupPopover, ...rest }, ref) => {
  const { labels, data } = useGroupBoxLayout()
  const { context } = useMetadata()

  return (
    <Flex column width="100%" height="100%" gap={4} padding={[4, 2]} ref={ref} {...rest}>
      <GroupBoxes
        data={data}
        labels={labels}
        renderBoxPopover={renderBoxPopover}
        renderGroupPopover={renderGroupPopover}
      />
      <Flex data-testid="legend-container" justifyContent="between">
        <Legend>{context}</Legend>
      </Flex>
    </Flex>
  )
})

export default Container
