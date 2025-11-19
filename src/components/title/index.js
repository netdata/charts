import React, { useMemo } from "react"
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
  const viewUnits = useUnitSign({ long: true })
  const rawUnits = useUnitSign({ withoutConversion: true, long: true })
  const name = useName()
  const isMinimal = useIsMinimal()
  const contextScope = useAttributeValue("contextScope")

  const unitsText = useMemo(() => {
    if (isMinimal || (!rawUnits && !viewUnits)) return null
    return (
      <TextSmall color="textLite" whiteSpace="nowrap">
        • {rawUnits && `[${rawUnits}]`}
        {viewUnits && viewUnits !== rawUnits && ` scaled to [${viewUnits}]`}
      </TextSmall>
    )
  }, [rawUnits, viewUnits, isMinimal])

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
      {unitsText}
    </Flex>
  )
}

export default withChartProvider(Title)
