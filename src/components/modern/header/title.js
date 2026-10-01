import React from "react"
import styled from "styled-components"
import { Flex, TextSmall, CopyToClipboard, getColor } from "@netdata/netdata-ui"
import { useAttributeValue, useName, useTitle, useUnitSign } from "@/components/provider"

const Heading = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  color: ${getColor("text")};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`

const ModernTitle = ({ withUnits = true }) => {
  const title = useTitle()
  const name = useName()
  const units = useUnitSign({ withoutConversion: true, long: true })
  const contextScope = useAttributeValue("contextScope")
  const hideName = useAttributeValue("hideName")
  const hideUnits = useAttributeValue("hideUnits")

  const showName = !!name && !hideName

  return (
    <Flex
      alignItems="baseline"
      gap={1.5}
      overflow="hidden"
      flex="shrink"
      data-testid="chartHeaderStatus-title"
    >
      {!!title && <Heading title={title}>{title}</Heading>}
      {showName && (
        <CopyToClipboard
          text={contextScope && contextScope.length ? contextScope.join(", ") : name}
        >
          <TextSmall color="textLite" whiteSpace="nowrap" truncate>
            {name}
          </TextSmall>
        </CopyToClipboard>
      )}
      {withUnits && !!units && !hideUnits && (
        <TextSmall color="textLite" whiteSpace="nowrap" title="Source unit">
          {`[${units}]`}
        </TextSmall>
      )}
    </Flex>
  )
}

export default ModernTitle
