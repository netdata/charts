import React from "react"
import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import Color, { ColorBar } from "@/components/line/dimensions/color"
import Name from "@/components/line/dimensions/name"
import Value, { Value as ValuePart } from "@/components/line/dimensions/value"
import { useChart, useVisibleDimensionId } from "@/components/provider"
import { labels as annotationLabels } from "@/helpers/annotations"
import Tooltip from "@/components/tooltip"
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
    <Flex alignItems="center" justifyContent="end" padding={[0, 0.5]}>
      <ValuePart {...rest} textAlign="right">
        {first}
      </ValuePart>
      {typeof last !== "undefined" && <ValuePart {...rest}>.</ValuePart>}
      <ValuePart as={Flex} flex={false} width={fractionDigits * 1.8} {...rest} textAlign="left">
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
        <Tooltip content={annotationLabels[ann] || ann}>
          <ValuePart {...rest} color={annotations[ann]}>
            {ann}
          </ValuePart>
        </Tooltip>
      </Flex>
    ))}
  </Flex>
)

const Dimension = ({ id, strong, chars, rowFlavour, size, fullCols }) => {
  const visible = useVisibleDimensionId(id)

  const chart = useChart()
  const fractionDigits = chart.getAttribute("unitsConversionFractionDigits")

  return (
    <GridRow opacity={visible ? null : "weak"}>
      <Flex alignItems="center" gap={1} position="relative" overflow="hidden">
        <ColorBackground
          id={id}
          valueKey={rowValueKeys[rowFlavour] || rowValueKeys.default}
          height={`${size > 18 ? 18 : size < 12 ? 12 : size}px`}
        >
          <Color id={id} />
        </ColorBackground>
        <Name padding={[1, 2]} flex id={id} strong={strong} maxLength={chars} fontSize="1.1em" />
      </Flex>
      <Value
        id={id}
        strong={strong}
        visible={visible}
        Component={ValueOnDot}
        fractionDigits={fractionDigits}
        color={rowFlavour === rowFlavours.default ? "text" : "textLite"}
        fontSize="1.1em"
      />
      {fullCols && (
        <>
          <Value
            id={id}
            strong={strong}
            visible={visible}
            valueKey="arp"
            Component={ValueOnDot}
            fractionDigits={2}
            color={rowFlavour === rowFlavours.ANOMALY_RATE ? "anomalyTextFocus" : "anomalyText"}
            fontSize="1.1em"
          />
          <Value
            textAlign="right"
            id={id}
            strong={strong}
            visible={visible}
            valueKey="pa"
            Component={AnnotationsValue}
            color={rowFlavour === rowFlavours.ANNOTATIONS ? "text" : "textLite"}
            fontSize="1.1em"
          />
        </>
      )}
    </GridRow>
  )
}

export default Dimension
