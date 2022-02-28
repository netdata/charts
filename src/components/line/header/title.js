import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import {
  useTitle,
  useAttributeValue,
  useUnit,
  useName,
  withChartProvider,
} from "@/components/provider"

export const Title = props => {
  const loaded = useAttributeValue("loaded")
  const title = useTitle()
  const unitSign = useUnit()
  const name = useName()

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
      {loaded && name && (
        <Text strong color="textLite" whiteSpace="nowrap">
          • {name}
        </Text>
      )}
      {loaded && unitSign && (
        <Text strong color="textLite" whiteSpace="nowrap">
          • [{unitSign}]
        </Text>
      )}
    </Flex>
  )
}

export default withChartProvider(Title)
