import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
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
      justifyContent="start"
      {...props}
    >
      <TextSmall color="textDescription" truncate>
        {title}
      </TextSmall>
      {loaded && name && (
        <TextSmall color="textLite" whiteSpace="nowrap">
          • {name}
        </TextSmall>
      )}
      {loaded && unitSign && (
        <TextSmall color="textLite" whiteSpace="nowrap">
          • [{unitSign}]
        </TextSmall>
      )}
    </Flex>
  )
}

export default withChartProvider(Title)
