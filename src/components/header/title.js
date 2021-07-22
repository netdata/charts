import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import { useMetadata, useAttributeValue } from "@/components/provider"

const Title = props => {
  const { title } = useMetadata()
  const unit = useAttributeValue("unit")

  return (
    <Flex
      overflow="hidden"
      data-testid="chartHeaderStatus-title"
      gap={1}
      flex="shrink"
      justifyContent="center"
      {...props}
    >
      <Text strong color="textDescription" truncate>
        {title}
      </Text>
      {unit && (
        <Text strong color="textLite" whiteSpace="nowrap">
          • [{unit}]
        </Text>
      )}
    </Flex>
  )
}

export default Title
