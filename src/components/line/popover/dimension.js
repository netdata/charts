import React from "react"
import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import Color, { ColorBar } from "@/components/line/dimensions/color"
import Name from "@/components/line/dimensions/name"
import Value, { Value as ValuePart } from "@/components/line/dimensions/value"
import { useChart, useVisibleDimensionId } from "@/components/provider"

const GridRow = styled(Flex).attrs({
  position: "relative",
  "data-testid": "chartPopover-dimension",
  padding: [1, 0],
})`
  display: contents;
`

const ColorBackground = styled(ColorBar).attrs({
  position: "absolute",
  top: 1,
  left: 2,
  backgroundOpacity: 0.4,
})``

const rowValueKeys = {
  ANOMALY_RATE: "ar",
  default: "value",
}

const ValueOnDot = ({ children, fractionDigits = 0, ...rest }) => {
  const [first, last] = children.toString().split(".")

  return (
    <Flex alignItems="center" justifyContent="end">
      <ValuePart {...rest} textAlign="right">
        {first}
      </ValuePart>
      {typeof last !== "undefined" && <ValuePart {...rest}>.</ValuePart>}
      <ValuePart as={Flex} flex={false} width={fractionDigits * 1.6} {...rest} textAlign="left">
        {last}
      </ValuePart>
    </Flex>
  )
}

const AnnotationsValue = ({ children: annotations, ...rest }) => (
  <Flex gap={1} justifyContent="end">
    {Object.keys(annotations).map(ann => (
      <Flex
        key={ann}
        border={{ size: "1px", side: "all", color: annotations[ann] }}
        round
        flex={false}
        padding={[0, 0.5]}
      >
        <ValuePart {...rest} color={annotations[ann]}>
          {ann}
        </ValuePart>
      </Flex>
    ))}
  </Flex>
)

const Dimension = ({ id, strong, chars, row }) => {
  const visible = useVisibleDimensionId(id)

  const chart = useChart()
  const fractionDigits = chart.getAttribute("unitsConversionFractionDigits")

  return (
    <GridRow opacity={visible ? null : "weak"}>
      <Flex alignItems="center" gap={1} position="relative">
        <ColorBackground id={id} valueKey={rowValueKeys[row] || rowValueKeys.default} height="18px">
          <Color id={id} />
        </ColorBackground>
        <Name padding={[1, 2]} flex id={id} strong={strong} maxLength={chars} />
      </Flex>
      <Value
        id={id}
        strong={strong}
        visible={visible}
        Component={ValueOnDot}
        fractionDigits={fractionDigits}
      />
      <Value
        id={id}
        strong={strong}
        visible={visible}
        valueKey="ar"
        color={["purple", "lilac"]}
        Component={ValueOnDot}
        fractionDigits={2}
      />
      <Value
        textAlign="right"
        id={id}
        strong={strong}
        visible={visible}
        valueKey="pa"
        Component={AnnotationsValue}
      />
    </GridRow>
  )
}

export default Dimension
