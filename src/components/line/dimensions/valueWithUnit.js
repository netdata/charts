import React from "react"
import styled from "styled-components"
import { Flex, TextMicro, TextSmall } from "@netdata/netdata-ui"
import { useValueWithUnit } from "@/components/provider"

const Container = styled(Flex).attrs({
  alignItems: "center",
  width: "100%",
})`
  display: grid;
  grid-template-columns: minmax(auto, 1fr) minmax(40px, max-content);
`

const UnitCell = styled(Flex).attrs({
  alignItems: "center",
  overflow: "hidden",
  padding: [0, 0, 0, 2],
  width: { min: "0px" },
})`
  box-sizing: border-box;
`

const HeaderLabel = styled(TextMicro).attrs({
  textAlign: "center",
})`
  grid-column: 1 / -1;
`

const ValueDetail = styled(TextMicro).attrs({
  margin: [1, 0, 0],
  textAlign: "right",
})`
  grid-column: 1;
  grid-row: 2;
`

export const ValueUnitGrid = ({
  value,
  unit,
  detail,
  color = "text",
  strong,
  testIdPrefix = "value-unit",
}) => (
  <Container data-testid={`${testIdPrefix}-grid`}>
    <TextSmall color={color} strong={strong} textAlign="right" whiteSpace="nowrap">
      {value}
    </TextSmall>
    <UnitCell data-testid={`${testIdPrefix}-cell`}>
      {unit && (
        <TextMicro color="textDescription" whiteSpace="nowrap" truncate>
          {unit}
        </TextMicro>
      )}
    </UnitCell>
    {detail && (
      <ValueDetail data-testid={`${testIdPrefix}-detail`} color="textDescription">
        {detail}
      </ValueDetail>
    )}
  </Container>
)

export const ValueUnitHeader = ({ label, strong = true }) => (
  <Container>
    <HeaderLabel strong={strong}>{label}</HeaderLabel>
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
  const { convertedValue, convertedUnit } = useValueWithUnit(value, {
    valueKey,
    fractionDigits,
    dimensionId,
    unitsKey,
    scaleByValue: true,
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
