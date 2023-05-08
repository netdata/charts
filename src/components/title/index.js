import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import { useTitle, useUnitSign, useName, withChartProvider } from "@/components/provider"

export const Title = props => {
  const title = useTitle()
  const units = useUnitSign({ long: true })
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
      {!!name && (
        <TextSmall color="textLite" whiteSpace="nowrap">
          {title ? "• " : ""}
          {name}
        </TextSmall>
      )}
      {!!units && (
        <TextSmall color="textLite" whiteSpace="nowrap">
          • [{units}]
        </TextSmall>
      )}
    </Flex>
  )
}

export default withChartProvider(Title)
