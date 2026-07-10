import React from "react"
import { Flex, Text, TextMicro, TextSmall } from "@netdata/netdata-ui"
import { useConverted, useUnitSign, useValueUnitAttributes } from "@/components/provider"

const getDisplayUnit = (unit, integrated) =>
  integrated && typeof unit === "string" && unit.endsWith("/s")
    ? unit.slice(0, -2)
    : unit

const StatValue = ({ value, valueKey, prominent, justifyContent }) => {
  const unitAttributes = useValueUnitAttributes(value, {
    valueKey,
    scaleByValue: true,
  })
  const convertedValue = useConverted(value, {
    valueKey,
    scaleByValue: true,
  })
  const convertedUnit = useUnitSign({ unitAttributes })
  const displayUnit = getDisplayUnit(convertedUnit, valueKey === "volume")
  const Value = prominent ? Text : TextSmall

  return (
    <Flex
      alignItems="end"
      gap={1}
      justifyContent={justifyContent}
      minWidth={0}
      data-testid="comparison-stat-value"
    >
      <Value strong textAlign={justifyContent === "end" ? "right" : undefined} whiteSpace="nowrap">
        {convertedValue}
      </Value>
      {!!displayUnit && (
        <TextMicro
          color="textDescription"
          whiteSpace="nowrap"
          truncate
          data-testid="comparison-stat-unit"
        >
          {displayUnit}
        </TextMicro>
      )}
    </Flex>
  )
}

export default StatValue
