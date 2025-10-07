import React from "react"
import styled from "styled-components"
import { Flex, TextMicro } from "@netdata/netdata-ui"
import Color, { ColorBar } from "@/components/line/dimensions/color"
import Name from "@/components/line/dimensions/name"
import Value, { Value as ValuePart } from "@/components/line/dimensions/value"
import { useChart, useVisibleDimensionId } from "@/components/provider"
import { labels as annotationLabels } from "@/helpers/annotations"
import { useIsHeatmap } from "@/helpers/heatmap"
import { rowFlavours } from "./dimensions"

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
  left: 0,
  backgroundOpacity: 0.4,
  round: 0.5,
})``

const rowValueKeys = {
  ANOMALY_RATE: "arp",
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

const AnnotationsValue = ({ children: annotations, showFull, ...rest }) => (
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
          {showFull ? annotationLabels[ann] || ann : ann}
        </ValuePart>
      </Flex>
    ))}
  </Flex>
)

const Dimension = ({ id, index, strong, rowFlavour }) => {
  const visible = useVisibleDimensionId(id)

  const chart = useChart()
  const fractionDigits = chart.getAttribute("unitsConversionFractionDigits")
  const isHeatmap = useIsHeatmap()

  return (
    <GridRow opacity={visible ? null : "weak"}>
      <TextMicro>{index < 9 ? index + 1 : ""}</TextMicro>
      <Flex alignItems="center" gap={1} position="relative">
        <ColorBackground
          id={id}
          valueKey={rowValueKeys[rowFlavour] || rowValueKeys.default}
          height="18px"
        >
          {!isHeatmap && <Color id={id} />}
        </ColorBackground>
        <Name
          padding={[1, 2]}
          flex
          id={id}
          strong={strong}
          noTooltip
          color={strong ? "textFocus" : "text"}
        />
      </Flex>
      <Value
        id={id}
        strong={strong}
        visible={visible}
        Component={ValueOnDot}
        fractionDigits={fractionDigits}
        color={rowFlavour === rowFlavours.default ? (strong ? "textFocus" : "text") : "textLite"}
      />
      <Value
        id={id}
        strong={strong}
        visible={visible}
        valueKey="arp"
        Component={ValueOnDot}
        fractionDigits={2}
        color={rowFlavour === rowFlavours.ANOMALY_RATE ? "anomalyTextFocus" : "anomalyText"}
      />
      <Value
        textAlign="right"
        id={id}
        strong={strong}
        visible={visible}
        valueKey="pa"
        Component={AnnotationsValue}
        color={
          rowFlavour === rowFlavours.ANNOTATIONS ? (strong ? "textFocus" : "text") : "textLite"
        }
        showFull={rowFlavour === rowFlavours.ANNOTATIONS}
      />
    </GridRow>
  )
}

export default Dimension
