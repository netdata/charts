import React from "react"
import styled from "styled-components"
import { Flex, TextMicro, TextSmall } from "@netdata/netdata-ui"
import { useConverted, useUnitSign, useValueUnitAttributes } from "@/components/provider"

const unitColumnWidth = "44px"

const Container = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) ${unitColumnWidth};
  align-items: center;
  width: 100%;
`

const UnitCell = styled(Flex).attrs({
  alignItems: "center",
  overflow: "hidden",
  width: { min: 0 },
})`
  box-sizing: border-box;
  padding-left: 6px;
`

export const ValueUnitGrid = ({ value, unit, color = "text", strong }) => (
  <Container data-testid="drawer-value-unit-grid">
    <TextSmall color={color} strong={strong} textAlign="right" whiteSpace="nowrap">
      {value}
    </TextSmall>
    <UnitCell data-testid="drawer-value-unit-cell">
      {unit && (
        <TextMicro color="textDescription" whiteSpace="nowrap" truncate>
          {unit}
        </TextMicro>
      )}
    </UnitCell>
  </Container>
)

export const ValueUnitHeader = ({ label, strong = true }) => (
  <Container>
    <TextMicro strong={strong} textAlign="right">
      {label}
    </TextMicro>
    <UnitCell>
      <TextMicro strong={strong}>Unit</TextMicro>
    </UnitCell>
  </Container>
)

const ValueWithUnit = ({
  value,
  dimensionId,
  valueKey,
  unitsKey = "units",
  fractionDigits,
  unit,
  visible = true,
  color,
  strong,
}) => {
  const unitAttributes = useValueUnitAttributes(value, {
    valueKey,
    dimensionId,
    unitsKey,
    scaleByValue: true,
  })
  const convertedValue = useConverted(value, {
    valueKey,
    fractionDigits,
    dimensionId,
    unitsKey,
    scaleByValue: true,
  })
  const convertedUnit = useUnitSign({
    dimensionId,
    key: unitsKey,
    unitAttributes,
  })

  if (!visible) return null

  return (
    <ValueUnitGrid
      value={convertedValue}
      unit={unit === undefined ? convertedUnit : unit}
      color={color}
      strong={strong}
    />
  )
}

export default ValueWithUnit
