import React, { memo } from "react"
import styled from "styled-components"
import { Flex, Text, TextMicro } from "@netdata/netdata-ui"
import { useChart, useConvertedValue } from "@/components/provider"
import Color, { BaseColorBar } from "@/components/line/dimensions/color"
import Label from "./label"

const Container = styled(Flex).attrs(props => ({
  round: true,
  border: { side: "all", color: "elementBackground" },
  width: { min: "196px", max: props.maxWidth ? `${props.maxWidth}px` : "80vw" },
  background: "dropdown",
  column: true,
  padding: [4],
  gap: 1,
}))`
  box-shadow: 0px 8px 12px rgba(9, 30, 66, 0.15), 0px 0px 1px rgba(9, 30, 66, 0.31);
`

const Grid = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: auto 2fr;
  column-gap: 8px;
  align-items: center;
`

const Labels = ({ index, label, groupLabel, data, id }) => {
  const chart = useChart()
  const { viewDimensions } = chart.getMetadata()

  const chartWidth = chart.getUI().getEstimatedChartWidth() * 0.9
  const value = chart.getRowDimensionValue(id, data)
  const convertedValue = useConvertedValue(value, "percent")

  return (
    <Container data-testid="chartPopover-labels" maxWidth={chartWidth} gap={2}>
      <Flex column>
        <TextMicro>{groupLabel}</TextMicro>
        <Text strong>{label}</Text>
        <Flex gap={2} alignItems="center">
          <BaseColorBar value={value} min={0} max={100} bg={["purple", "lilac"]} height="18px" />
          <TextMicro strong>{convertedValue}%</TextMicro>
        </Flex>
      </Flex>
      <Grid gap={1} column>
        {Object.keys(viewDimensions.labels).map(key => (
          <Label
            key={key}
            label={key}
            value={viewDimensions.labels[key]?.[index]}
            chars={chartWidth ? chartWidth / 3 : 200}
          />
        ))}
      </Grid>
    </Container>
  )
}

export default memo(Labels)
