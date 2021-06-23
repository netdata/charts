import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text } from "@netdata/netdata-ui/lib/components/typography"

const Title = ({ chart, ...rest }) => {
  const { title } = chart.getMetadata()

  return (
    <Flex {...rest}>
      <Text strong>{title}</Text>
    </Flex>
  )
}

export default Title
