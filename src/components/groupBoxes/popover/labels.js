import React, { memo } from "react"
import styled from "styled-components"
import { Flex, TextMicro } from "@netdata/netdata-ui"
import { useChart, useAttributeValue, useValueWithUnit } from "@/components/provider"
import { BaseColorBar } from "@/components/line/dimensions/color"
import Label from "./label"

const Container = styled(Flex).attrs(props => ({
  round: true,
  border: { side: "all", color: "elementBackground" },
  width: { min: "300px", max: props.maxWidth ? `${props.maxWidth}px` : "80vw" },
  background: "dropdown",
  column: true,
  padding: [4],
  gap: 1,
}))`
  box-shadow:
    0px 8px 12px rgba(9, 30, 66, 0.15),
    0px 0px 1px rgba(9, 30, 66, 0.31);
`

const ColorBackground = styled(BaseColorBar).attrs({
  position: "absolute",
  top: 1,
  left: 0,
  backgroundOpacity: 0.4,
  round: 0.5,
})``

const Grid = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, max-content) minmax(0, 2fr);
  column-gap: 8px;
  align-items: center;
`

const Labels = ({ label, groupLabel, data, id, ref }) => {
  const chart = useChart()
  const viewDimensions = chart.getAttribute("viewDimensions")
  const index = chart.getDimensionIndex(id)

  const min = useAttributeValue("min")
  const max = useAttributeValue("max")

  const chartWidth = chart.getUI().getChartWidth() * 0.9
  const value = chart.getRowDimensionValue(id, data)
  const displayValue = chart.getRowDimensionValue(id, data, { abs: false })
  const { convertedValue, convertedUnit } = useValueWithUnit(displayValue, {
    dimensionId: id,
    scaleByValue: true,
  })

  return (
    <Container data-testid="chartPopover-labels" maxWidth={chartWidth} gap={2} ref={ref}>
      <Flex column gap={1}>
        <TextMicro>{groupLabel}</TextMicro>
        <TextMicro strong>{label}</TextMicro>
        <Flex alignItems="center" position="relative">
          <ColorBackground
            value={value}
            min={min}
            max={max}
            bg={chart.getThemeAttribute("themeGroupBoxesMax")}
            height="18px"
          />
          <TextMicro padding={[1.5, 2]} strong>
            {convertedValue} {convertedValue !== "-" && convertedUnit}
          </TextMicro>
        </Flex>
      </Flex>
      {!!viewDimensions?.labels && (
        <Grid gap={1} column>
          {Object.keys(viewDimensions.labels).map(key => (
            <Label key={key} label={key} value={viewDimensions.labels[key]?.[index]} />
          ))}
        </Grid>
      )}
    </Container>
  )
}

export default memo(Labels)
