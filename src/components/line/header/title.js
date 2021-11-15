import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import { useTitle, useAttributeValue, useUnit, withChartProvider } from "@/components/provider"

const Unit = () => {
  const unitSign = useUnit()

  if (!unitSign) return null

  return (
    <Text strong color="textLite" whiteSpace="nowrap">
      • [{unitSign}]
    </Text>
  )
}

export const Title = props => {
  const loaded = useAttributeValue("loaded")
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
      {loaded && <Unit />}
    </Flex>
  )
}

export default withChartProvider(Title)
