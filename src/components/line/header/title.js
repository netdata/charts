import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import { useTitle, useAttributeValue, useUnit } from "@/components/provider"

const Title = props => {
  const loaded = useAttributeValue("loaded")
  const unitSign = useUnit()
  const title = useTitle()

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
      {loaded && unitSign && (
        <Text strong color="textLite" whiteSpace="nowrap">
          • [{unitSign}]
        </Text>
      )}
    </Flex>
  )
}

export default Title
