import React from "react"
import { Flex, TextSmall, TextMicro } from "@netdata/netdata-ui"
import styled from "styled-components"
import Color, { ColorBar } from "@/components/line/dimensions/color"
import Name from "@/components/line/dimensions/name"
import Units from "@/components/line/dimensions/units"
import Value, { Value as ValuePart } from "@/components/line/dimensions/value"
import { useChart, useAttributeValue, useVisibleDimensionId } from "@/components/provider"
import Label from "@/components/filterToolbox/label"
import { rowFlavours } from "../../popover/dimensions"

const ColorBackground = styled(ColorBar).attrs({
  position: "absolute",
  top: 1,
  left: 2,
  backgroundOpacity: 0.4,
  round: 0.5,
})``

const rowValueKeys = {
  ANOMALY_RATE: "arp",
  default: "value",
}

const metricsByValue = {
  dimension: "dimensions",
  node: "nodes",
  instance: "instances",
  label: "labels",
  value: "values",
  default: "values",
}

const emptyArray = []

export const labelColumn = fallbackExpandKey => ({
  id: "label",
  header: () => <TextSmall strong>Name</TextSmall>,
  size: 300,
  minSize: 60,
  cell: ({
    row: { original: id, depth = 0, getCanExpand, getToggleExpandedHandler, getIsExpanded },
  }) => {
    const [, row] = useAttributeValue("hoverX") || emptyArray
    const rowFlavour = rowFlavours[row] || rowFlavours.default

    const visible = useVisibleDimensionId(id)

    const chart = useChart()
    const fractionDigits = chart.getAttribute("unitsConversionFractionDigits")

    return (
      <Flex
        justifyContent="between"
        alignItems="center"
        padding={[0, 0, 0, depth * 3]}
        opacity={visible ? null : "weak"}
      >
        <Flex alignItems="center" gap={1} position="relative" width="100%">
          {visible && (
            <ColorBackground
              id={id}
              valueKey={rowValueKeys[rowFlavour] || rowValueKeys.default}
              height="18px"
            >
              <Color id={id} />
            </ColorBackground>
          )}
          <Name padding={[1, 2]} flex id={id} />
        </Flex>
        {getCanExpand() && (
          <Label
            label={
              metricsByValue[row.original.value] ||
              metricsByValue[fallbackExpandKey] ||
              metricsByValue.default
            }
            onClick={e => {
              getToggleExpandedHandler()(e)
              setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "nearest" }))
            }}
            iconRotate={getIsExpanded() ? 2 : null}
            textProps={{ fontSize: "10px", color: "textLite" }}
          />
        )}
      </Flex>
    )
  },
})

const ValueOnDot = ({ children, fractionDigits = 0, ...rest }) => {
  const [first, last] = children.toString().split(".")

  return (
    <Flex alignItems="center" justifyContent="start">
      <ValuePart {...rest} flex={false} basis={3 * 1.6} textAlign="right">
        {first}
      </ValuePart>
      {typeof last !== "undefined" && <ValuePart {...rest}>.</ValuePart>}
      <ValuePart as={Flex} flex={false} width={fractionDigits * 1.6} {...rest} textAlign="left">
        {last}
      </ValuePart>
    </Flex>
  )
}

export const valueColumn = () => ({
  id: "value",
  header: (
    <TextMicro>
      Value <Units visible />
    </TextMicro>
  ),
  size: 45,
  minSize: 45,
  cell: ({
    row: { original: id, depth = 0, getCanExpand, getToggleExpandedHandler, getIsExpanded },
  }) => {
    const visible = useVisibleDimensionId(id)

    const chart = useChart()
    const fractionDigits = chart.getAttribute("unitsConversionFractionDigits")

    return (
      <Value
        period="latest"
        id={id}
        visible={visible}
        Component={ValueOnDot}
        fractionDigits={fractionDigits}
      />
    )
  },
  sortingFn: "basic",
})

export const anomalyColumn = ({ period, objKey }) => ({
  id: objKey ? `${objKey}-arp` : "arp",
  header: <TextMicro>AR %</TextMicro>,
  size: 45,
  minSize: 45,
  cell: ({
    row: { original: id, depth = 0, getCanExpand, getToggleExpandedHandler, getIsExpanded },
  }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <Value
        period={period}
        objKey={objKey}
        textAlign="right"
        id={id}
        visible={visible}
        valueKey="arp"
        Component={ValueOnDot}
        fractionDigits={2}
        color="anomalyTextFocus"
      />
    )
  },
  sortingFn: "basic",
})

export const minColumn = ({ period, objKey }) => ({
  id: objKey ? `${objKey}-min` : "min",
  header: (
    <TextMicro>
      Min <Units visible />
    </TextMicro>
  ),
  size: 45,
  minSize: 45,
  cell: ({
    row: { original: id, depth = 0, getCanExpand, getToggleExpandedHandler, getIsExpanded },
  }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <Value
        period={period}
        objKey={objKey}
        textAlign="right"
        id={id}
        visible={visible}
        valueKey="min"
        Component={ValueOnDot}
        fractionDigits={2}
      />
    )
  },
  sortingFn: "basic",
})

export const avgColumn = ({ period, objKey }) => ({
  id: objKey ? `${objKey}-avg` : "avg",
  header: (
    <TextMicro>
      Avg <Units visible />
    </TextMicro>
  ),
  size: 45,
  minSize: 45,
  cell: ({
    row: { original: id, depth = 0, getCanExpand, getToggleExpandedHandler, getIsExpanded },
  }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <Value
        period={period}
        objKey={objKey}
        textAlign="right"
        id={id}
        visible={visible}
        valueKey="avg"
        Component={ValueOnDot}
        fractionDigits={2}
      />
    )
  },
  sortingFn: "basic",
})

export const maxColumn = ({ period, objKey }) => ({
  id: objKey ? `${objKey}-max` : "max",
  header: (
    <TextMicro>
      Max <Units visible />
    </TextMicro>
  ),
  size: 45,
  minSize: 45,
  cell: ({
    row: { original: id, depth = 0, getCanExpand, getToggleExpandedHandler, getIsExpanded },
  }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <Value
        period={period}
        objKey={objKey}
        textAlign="right"
        id={id}
        visible={visible}
        valueKey="max"
        Component={ValueOnDot}
        fractionDigits={2}
      />
    )
  },
  sortingFn: "basic",
})
