import React from "react"
import styled from "styled-components"
import { Flex, TextMicro } from "@netdata/netdata-ui"
import Color, { ColorBar } from "@/components/line/dimensions/color"
import Name from "@/components/line/dimensions/name"
import Value, { Value as ValuePart } from "@/components/line/dimensions/value"
import {
  useLatestDisplayValue,
  useValueWithUnit,
  useVisibleDimensionId,
} from "@/components/provider"
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
  top: 0,
  left: 0,
  backgroundOpacity: 0.4,
  round: 0.5,
})``

const rowValueKeys = {
  ANOMALY_RATE: "arp",
  default: "value",
}

const DisplayValue = ({ id, strong, visible, color }) => {
  const value = useLatestDisplayValue(id, { allowNull: true })
  const { convertedValue, convertedUnit } = useValueWithUnit(value, {
    dimensionId: id,
    scaleByValue: true,
  })

  return (
    <Flex alignItems="center" justifyContent="end" gap={1} padding={[0, 1]}>
      <ValuePart strong={strong} color={color} fontSize="1.1em" textAlign="right">
        {visible ? convertedValue : null}
      </ValuePart>
      {visible && !!convertedUnit && (
        <TextMicro color="textDescription" whiteSpace="nowrap">
          {convertedUnit}
        </TextMicro>
      )}
    </Flex>
  )
}

const PlainValue = props => <ValuePart {...props} textAlign="right" />

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

const Dimension = ({ id, strong, rowFlavour, fullCols }) => {
  const visible = useVisibleDimensionId(id)
  const color = rowFlavour === rowFlavours.default ? "text" : "textLite"

  return (
    <GridRow opacity={visible ? null : "weak"}>
      <Flex alignItems="center" gap={1} position="relative" overflow="hidden">
        <ColorBackground
          id={id}
          valueKey={rowValueKeys[rowFlavour] || rowValueKeys.default}
          height="100%"
        >
          <Color id={id} />
        </ColorBackground>
        <Name padding={[0.5, 1.5]} flex id={id} strong={strong} fontSize="1.1em" />
      </Flex>
      <DisplayValue
        id={id}
        strong={strong}
        visible={visible}
        color={color}
      />
      {fullCols && (
        <>
          <Value
            id={id}
            strong={strong}
            visible={visible}
            valueKey="arp"
            Component={PlainValue}
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
