import React from "react"
import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import Color, { ColorBar } from "@/components/line/dimensions/color"
import Name from "@/components/line/dimensions/name"
import Units from "@/components/line/dimensions/units"
import Value, { Value as ValuePart } from "@/components/line/dimensions/value"
import {
  useLatestValue,
  useValueUnitAttributes,
  useVisibleDimensionId,
} from "@/components/provider"
import { labels as annotationLabels } from "@/helpers/annotations"
import { useIsHeatmap } from "@/helpers/heatmap"
import { rowFlavours } from "./dimensions"
import { popoverGridColumns } from "./layout"

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

const DimensionNameCell = styled(Flex).attrs({
  "data-testid": "chartPopover-dimensionNameCell",
  alignItems: "center",
  gap: 1,
  position: "relative",
  overflow: "hidden",
  width: { min: 0 },
})`
  min-width: ${popoverGridColumns.dimensionMin};

  [data-testid="chartDimensions-name"] {
    min-width: 0;
    max-width: 100%;
  }
`

const rowValueKeys = {
  ANOMALY_RATE: "arp",
  default: "value",
}

const PlainValue = props => <ValuePart {...props} textAlign="right" whiteSpace="nowrap" />

const UnitCell = styled(Flex).attrs({
  "data-testid": "chartPopover-dimensionUnitCell",
  alignItems: "center",
  overflow: "hidden",
  width: { min: 0 },
  padding: [0, 0, 0, 2],
})`
  box-sizing: border-box;
`

const ValueWithUnits = ({ id, visible, children, ...rest }) => {
  const isHeatmap = useIsHeatmap()
  const value = useLatestValue(id, { allowNull: true })
  const unitAttributes = useValueUnitAttributes(value, {
    dimensionId: id,
    scaleByValue: true,
  })

  return (
    <>
      <PlainValue {...rest}>{children}</PlainValue>
      <UnitCell>
        {!isHeatmap && (
          <Units
            visible={visible}
            dimensionId={id}
            value={value}
            unitAttributes={unitAttributes}
            scaleByValue
          />
        )}
      </UnitCell>
    </>
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

const Dimension = ({ id, strong, rowFlavour }) => {
  const visible = useVisibleDimensionId(id)
  const isHeatmap = useIsHeatmap()

  return (
    <GridRow opacity={visible ? null : "weak"}>
      <DimensionNameCell>
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
      </DimensionNameCell>
      <Value
        id={id}
        strong={strong}
        visible={visible}
        Component={props => <ValueWithUnits id={id} visible={visible} {...props} />}
        scaleByValue
        color={rowFlavour === rowFlavours.default ? (strong ? "textFocus" : "text") : "textLite"}
      />
      <Value
        id={id}
        strong={strong}
        visible={visible}
        valueKey="arp"
        Component={PlainValue}
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
