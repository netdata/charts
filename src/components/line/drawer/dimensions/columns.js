import React from "react"
import { Flex, ProgressBar, TextSmall, TextMicro, MasterCard } from "@netdata/netdata-ui"
import Label from "../../filterToolbox/label"

import styled from "styled-components"
import Color, { ColorBar } from "@/components/line/dimensions/color"
import Name from "@/components/line/dimensions/name"
import Units from "@/components/line/dimensions/units"
import Value, { Value as ValuePart } from "@/components/line/dimensions/value"
import { useChart, useAttributeValue, useVisibleDimensionId } from "@/components/provider"
import { rowFlavours } from "../../popover/dimensions"

const ColorBackground = styled(ColorBar).attrs({
  position: "absolute",
  top: 1,
  left: 2,
  backgroundOpacity: 0.4,
  round: 0.5,
})``

const rowValueKeys = {
  ANOMALY_RATE: "ar",
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
  header: () => <TextSmall strong>Dimension</TextSmall>,
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
      <Flex justifyContent="between" alignItems="center" padding={[0, 0, 0, depth * 3]}>
        <Flex alignItems="center" gap={1} position="relative" width="100%">
          <ColorBackground
            id={id}
            valueKey={rowValueKeys[rowFlavour] || rowValueKeys.default}
            height="18px"
          >
            <Color id={id} />
          </ColorBackground>
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
      <Value id={id} visible={visible} Component={ValueOnDot} fractionDigits={fractionDigits} />
    )
  },
  sortingFn: "basic",
})

export const anomalyColumn = () => ({
  id: "ar",
  header: <TextMicro>AR %</TextMicro>,
  size: 45,
  minSize: 45,
  cell: ({
    row: { original: id, depth = 0, getCanExpand, getToggleExpandedHandler, getIsExpanded },
  }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <Value
        textAlign="right"
        id={id}
        visible={visible}
        valueKey="ar"
        Component={ValueOnDot}
        fractionDigits={2}
        color="anomalyTextFocus"
      />
    )
  },
  sortingFn: "basic",
})

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

export const annotationsColumn = () => ({
  id: "pa",
  header: <TextMicro>Annotations</TextMicro>,
  size: 45,
  minSize: 45,
  cell: ({
    row: { original: id, depth = 0, getCanExpand, getToggleExpandedHandler, getIsExpanded },
  }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <Value
        textAlign="right"
        id={id}
        visible={visible}
        valueKey="pa"
        Component={AnnotationsValue}
      />
    )
  },
  sortingFn: "basic",
})

export const instancesColumn = () => ({
  id: "instances",
  header: <TextSmall strong>Instances</TextSmall>,
  size: 90,
  minSize: 30,
  cell: ({ getValue, row }) => {
    if (!row.original.info?.is) return <TextSmall color="textLite">{getValue()}</TextSmall>

    const { qr = 0, sl = 0, ex = 0 } = row.original.info.is
    return (
      <>
        <TextSmall color="textLite">
          <TextSmall color="primary">{qr}</TextSmall> out of {sl + ex}
        </TextSmall>
        <ProgressBar
          background="progressBg"
          color={["green", "deyork"]}
          height={2}
          width={`${(qr / (sl + ex)) * 100}%`}
          containerWidth="100%"
          border="none"
        />
      </>
    )
  },
  sortingFn: "basic",
})

export const metricsColumn = () => ({
  id: "metrics",
  header: <TextSmall strong>Metrics</TextSmall>,
  size: 90,
  minSize: 30,
  cell: ({ row, getValue }) => {
    if (!row.original.info?.ds) return <TextSmall color="textLite">{getValue()}</TextSmall>

    const { qr = 0, sl = 0, ex = 0 } = row.original.info.ds
    return (
      <Flex alignItems="center" gap={1} position="relative">
        <ColorBackground
          id={id}
          valueKey={rowValueKeys[rowFlavour] || rowValueKeys.default}
          height="18px"
        >
          <Color id={id} />
        </ColorBackground>
        <Name padding={[1, 2]} flex id={id} strong={strong} maxLength={chars} />
      </Flex>
    )
  },
  sortingFn: "basic",
})

export const contributionColumn = () => ({
  id: "contribution",
  header: <TextSmall strong>Contribution %</TextSmall>,
  size: 120,
  minSize: 30,
  cell: ({ row, getValue }) => {
    if (!row.original.info?.sts) return <TextSmall color="textLite">{getValue()}</TextSmall>

    return (
      <>
        <TextSmall color="primary">
          {Math.round((getValue() + Number.EPSILON) * 100) / 100}%
        </TextSmall>
        <ProgressBar
          background="progressBg"
          color={["green", "deyork"]}
          height={2}
          width={`${getValue()}%`}
          containerWidth="100%"
          border="none"
        />
      </>
    )
  },
  sortingFn: "basic",
})

export const anomalyRateColumn = () => ({
  id: "anomalyRate",
  header: <TextSmall strong>AR %</TextSmall>,
  size: 120,
  minSize: 30,
  cell: ({ row, getValue }) => {
    if (!row.original.info?.sts) return <TextSmall color="textLite">{getValue()}</TextSmall>

    return (
      <>
        <TextSmall color="textLite">
          {Math.round((getValue() + Number.EPSILON) * 100) / 100}%
        </TextSmall>
        <ProgressBar
          background="progressBg"
          color="anomalyText"
          height={2}
          width={`${getValue()}%`}
          containerWidth="100%"
          border="none"
        />
      </>
    )
  },
  sortingFn: "basic",
})

export const alertsColumn = () => ({
  id: "alerts",
  header: <TextSmall strong>Chart alerts</TextSmall>,
  size: 130,
  minSize: 30,
  cell: ({ row, getValue }) => {
    if (!row.original.info?.al) return <TextSmall color="textLite">{getValue()}</TextSmall>

    const { cl = 0, cr = 0, wr = 0 } = row.original.info.al

    const pillLeft = { text: cr, flavour: cr ? "error" : "disabledError" }
    const pillRight = { text: wr, flavour: wr ? "warning" : "disabledWarning" }
    const pillEnd = { text: cl, flavour: cl ? "clear" : "disabledClear" }

    return (
      <div>
        <Flex flex={false}>
          <MasterCard pillLeft={pillLeft} pillRight={pillRight} pillEnd={pillEnd} />
        </Flex>
      </div>
    )
  },
  sortingFn: "basic",
})
