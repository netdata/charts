import React from "react"
import { Flex, TextSmall, CopyToClipboard } from "@netdata/netdata-ui"
import {
  useTitle,
  useUnitSign,
  useName,
  withChartProvider,
  useIsMinimal,
  useAttributeValue,
} from "@/components/provider"

export const Title = props => {
  const title = useTitle()
  const units = useUnitSign({ long: true })
  const name = useName()
  const isMinimal = useIsMinimal()
  const contextScope = useAttributeValue("contextScope")

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
      {!!name && (!isMinimal || !title) && (
        <CopyToClipboard
          text={contextScope && contextScope.length ? contextScope.join(", ") : name}
        >
          <TextSmall color="textLite" whiteSpace="nowrap">
            {title ? "• " : ""}
            {name}
          </TextSmall>
        </CopyToClipboard>
      )}
      {!!units && !isMinimal && (
        <TextSmall color="textLite" whiteSpace="nowrap">
          • [{units}]
        </TextSmall>
      )}
    </Flex>
  )
}

export default withChartProvider(Title)
