import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import { useChart } from "@/components/provider"

const Title = props => {
  const chart = useChart()
  const { title } = chart.getMetadata()

  return (
    <Flex data-testid="chartHeaderStatus-title" {...props}>
      <Text strong>{title}</Text>
    </Flex>
  )
}

export default Title
