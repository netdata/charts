import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import { useChart, useUnitSign } from "@/components/provider"

const Title = props => {
  const chart = useChart()
  const { title } = chart.getMetadata()
  const unit = useUnitSign()

  return (
    <Flex data-testid="chartHeaderStatus-title" gap={1} {...props}>
      <Text strong color="textDescription">
        {title}
      </Text>
      {unit && (
        <Text strong color="textLite">
          • [{unit}]
        </Text>
      )}
    </Flex>
  )
}

export default Title
