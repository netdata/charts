import React from "react"
import { Flex, TextSmall, TextMicro } from "@netdata/netdata-ui"
import styled from "styled-components"
import Color, { ColorBar } from "@/components/line/dimensions/color"
import Name from "@/components/line/dimensions/name"
import Units, { Value as UnitsText } from "@/components/line/dimensions/units"
import { Value as ValuePart } from "@/components/line/dimensions/value"
import {
  useChart,
  useAttributeValue,
  useVisibleDimensionId,
  getValueByPeriod,
  convert,
  useConverted,
} from "@/components/provider"
import Label from "@/components/filterToolbox/label"
import { rowFlavours } from "@/components/line/popover/dimensions"

const getCachedValue = (chart, valueCache, id, { key, period, objKey, allowNull = true }) => {
  if (!objKey && valueCache) return valueCache.get(id, key, { period })

  return (getValueByPeriod[period] || getValueByPeriod.latest)({
    chart,
    id,
    valueKey: key,
    objKey,
    allowNull,
  })
}

export const makeNumberSortingFn =
  (chart, { key, period, objKey, valueCache }) =>
  (rowA, rowB) => {
    const aId = rowA.original
    const bId = rowB.original

    const aValue = getCachedValue(chart, valueCache, aId, { key, period, objKey })
    const bValue = getCachedValue(chart, valueCache, bId, { key, period, objKey })

    const result = aValue - bValue

    if (!result || isNaN(result))
      return aId.localeCompare(bId, undefined, {
        sensitivity: "accent",
        ignorePunctuation: true,
      })

    return result > 0 ? 1 : -1
  }

const ColorBackground = styled(ColorBar).attrs({
  position: "absolute",
  top: 1.5,
  left: 0,
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

export const labelColumn = (chart, fallbackExpandKey) => ({
  id: "label",
  header: <TextSmall strong>Name</TextSmall>,
  size: 200,
  minSize: 60,
  renderString: row => chart.getDimensionName(row.original),
  cell: ({
    row: { original: id, depth = 0, getCanExpand, getToggleExpandedHandler, getIsExpanded },
  }) => {
    const [, row] = useAttributeValue("hoverX") || emptyArray
    const rowFlavour = rowFlavours[row] || rowFlavours.default

    const visible = useVisibleDimensionId(id)

    return (
      <Flex
        justifyContent="between"
        alignItems="center"
        padding={[0, 0, 0, depth * 3]}
        opacity={visible ? null : "weak"}
        width="100%"
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
  sortingFn: (rowA, rowB) => {
    const aId = rowA.original
    const bId = rowB.original

    return aId.localeCompare(bId, undefined, {
      sensitivity: "accent",
      ignorePunctuation: true,
    })
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

const CachedValue = ({
  id,
  visible,
  valueKey = "value",
  period = "latest",
  objKey,
  unitsKey,
  valueCache,
  Component = ValuePart,
  fractionDigits,
  ...rest
}) => {
  const chart = useChart()
  const value = getCachedValue(chart, valueCache, id, {
    key: valueKey,
    period,
    objKey,
  })
  const convertedValue = useConverted(value, { valueKey, fractionDigits, dimensionId: id, unitsKey })

  if (!visible) return null

  return <Component {...rest}>{convertedValue}</Component>
}

const renderValueString = (
  chart,
  row,
  { key = "value", period = "latest", objKey, unitsKey, valueCache, fractionDigits }
) =>
  convert(
    chart,
    getCachedValue(chart, valueCache, row.original, { key, period, objKey }),
    {
      valueKey: key,
      fractionDigits,
      dimensionId: row.original,
      unitsKey,
    }
  )

export const valueColumn = (chart, { valueCache } = {}) => ({
  id: "value",
  header: (
    <Flex column>
      <TextMicro>Value</TextMicro>
      <Units visible />
    </Flex>
  ),
  headerString: () => `Value (${chart.getUnitSign({ key: "units" })})`,
  size: 60,
  minSize: 60,
  renderString: row =>
    renderValueString(chart, row, {
      valueCache,
      fractionDigits: chart.getAttribute("unitsConversionFractionDigits"),
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    const chart = useChart()

    return (
      <CachedValue
        period="latest"
        id={id}
        visible={visible}
        valueCache={valueCache}
        Component={ValueOnDot}
        fractionDigits={chart.getAttribute("unitsConversionFractionDigits")}
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "value", period: "latest", valueCache }),
})

export const anomalyColumn = (chart, { period, objKey, valueCache }) => ({
  id: objKey ? `${objKey}-arp` : "arp",
  header: (
    <Flex column>
      <TextMicro>AR</TextMicro>
      <UnitsText>%</UnitsText>
    </Flex>
  ),
  headerString: () => "Anomaly%",
  size: 60,
  minSize: 60,
  renderString: row =>
    renderValueString(chart, row, {
      key: "arp",
      period,
      objKey,
      valueCache,
      fractionDigits: chart.getAttribute("unitsConversionFractionDigits"),
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <CachedValue
        period={period}
        objKey={objKey}
        textAlign="right"
        id={id}
        visible={visible}
        valueKey="arp"
        valueCache={valueCache}
        Component={ValueOnDot}
        fractionDigits={chart.getAttribute("unitsConversionFractionDigits")}
        color="anomalyTextFocus"
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "arp", period, objKey, valueCache }),
})

export const minColumn = (chart, { period, objKey, valueCache }) => ({
  id: objKey ? `${objKey}-min` : "min",
  header: (
    <Flex column>
      <TextMicro>Min</TextMicro>
      <Units visible />
    </Flex>
  ),
  headerString: () => `Min (${chart.getUnitSign({ key: "units" })})`,
  size: 60,
  minSize: 60,
  renderString: row =>
    renderValueString(chart, row, {
      key: "min",
      period,
      objKey,
      valueCache,
      fractionDigits: chart.getAttribute("unitsConversionFractionDigits"),
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <CachedValue
        period={period}
        objKey={objKey}
        textAlign="right"
        id={id}
        visible={visible}
        valueKey="min"
        valueCache={valueCache}
        Component={ValueOnDot}
        fractionDigits={chart.getAttribute("unitsConversionFractionDigits")}
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "min", period, objKey, valueCache }),
})

export const avgColumn = (chart, { period, objKey, valueCache }) => ({
  id: objKey ? `${objKey}-avg` : "avg",
  header: (
    <Flex column>
      <TextMicro>Avg</TextMicro>
      <Units visible />
    </Flex>
  ),
  headerString: () => `Avg (${chart.getUnitSign({ key: "units" })})`,
  size: 60,
  minSize: 60,
  renderString: row =>
    renderValueString(chart, row, {
      key: "avg",
      period,
      objKey,
      valueCache,
      fractionDigits: chart.getAttribute("unitsConversionFractionDigits"),
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <CachedValue
        period={period}
        objKey={objKey}
        textAlign="right"
        id={id}
        visible={visible}
        valueKey="avg"
        valueCache={valueCache}
        Component={ValueOnDot}
        fractionDigits={chart.getAttribute("unitsConversionFractionDigits")}
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "avg", period, objKey, valueCache }),
})

export const maxColumn = (chart, { period, objKey, valueCache }) => ({
  id: objKey ? `${objKey}-max` : "max",
  header: (
    <Flex column>
      <TextMicro>Max</TextMicro>
      <Units visible />
    </Flex>
  ),
  headerString: () => `Max (${chart.getUnitSign({ key: "units" })})`,
  size: 60,
  minSize: 60,
  renderString: row =>
    renderValueString(chart, row, {
      key: "max",
      period,
      objKey,
      valueCache,
      fractionDigits: chart.getAttribute("unitsConversionFractionDigits"),
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <CachedValue
        period={period}
        objKey={objKey}
        textAlign="right"
        id={id}
        visible={visible}
        valueKey="max"
        valueCache={valueCache}
        Component={ValueOnDot}
        fractionDigits={chart.getAttribute("unitsConversionFractionDigits")}
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "max", period, objKey, valueCache }),
})

export const medianColumn = (chart, { period, objKey, valueCache }) => ({
  id: objKey ? `${objKey}-median` : "median",
  header: (
    <Flex column>
      <TextMicro>Median</TextMicro>
      <Units visible />
    </Flex>
  ),
  headerString: () => `Median (${chart.getUnitSign({ key: "units" })})`,
  size: 60,
  minSize: 60,
  renderString: row =>
    renderValueString(chart, row, {
      key: "median",
      period,
      objKey,
      valueCache,
      fractionDigits: chart.getAttribute("unitsConversionFractionDigits"),
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <CachedValue
        period={period}
        objKey={objKey}
        textAlign="right"
        id={id}
        visible={visible}
        valueKey="median"
        valueCache={valueCache}
        Component={ValueOnDot}
        fractionDigits={chart.getAttribute("unitsConversionFractionDigits")}
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "median", period, objKey, valueCache }),
})

export const stdDevColumn = (chart, { period, objKey, valueCache }) => ({
  id: objKey ? `${objKey}-stddev` : "stddev",
  header: (
    <Flex column>
      <TextMicro>StdDev</TextMicro>
      <Units visible />
    </Flex>
  ),
  headerString: () => `StdDev (${chart.getUnitSign({ key: "units" })})`,
  size: 60,
  minSize: 60,
  renderString: row =>
    renderValueString(chart, row, {
      key: "stddev",
      period,
      objKey,
      valueCache,
      fractionDigits: chart.getAttribute("unitsConversionFractionDigits"),
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <CachedValue
        period={period}
        objKey={objKey}
        textAlign="right"
        id={id}
        visible={visible}
        valueKey="stddev"
        valueCache={valueCache}
        Component={ValueOnDot}
        fractionDigits={chart.getAttribute("unitsConversionFractionDigits")}
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "stddev", period, objKey, valueCache }),
})

export const p95Column = (chart, { period, objKey, valueCache }) => ({
  id: objKey ? `${objKey}-p95` : "p95",
  header: (
    <Flex column>
      <TextMicro>P95</TextMicro>
      <Units visible />
    </Flex>
  ),
  headerString: () => `95th Percentile (${chart.getUnitSign({ key: "units" })})`,
  size: 60,
  minSize: 60,
  renderString: row =>
    renderValueString(chart, row, {
      key: "p95",
      period,
      objKey,
      valueCache,
      fractionDigits: chart.getAttribute("unitsConversionFractionDigits"),
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <CachedValue
        period={period}
        objKey={objKey}
        textAlign="right"
        id={id}
        visible={visible}
        valueKey="p95"
        valueCache={valueCache}
        Component={ValueOnDot}
        fractionDigits={chart.getAttribute("unitsConversionFractionDigits")}
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "p95", period, objKey, valueCache }),
})

export const rangeColumn = (chart, { period, objKey, valueCache }) => ({
  id: objKey ? `${objKey}-range` : "range",
  header: (
    <Flex column>
      <TextMicro>Range</TextMicro>
      <Units visible />
    </Flex>
  ),
  headerString: () => `Range (${chart.getUnitSign({ key: "units" })})`,
  size: 60,
  minSize: 60,
  renderString: row =>
    renderValueString(chart, row, {
      key: "range",
      period,
      objKey,
      valueCache,
      fractionDigits: chart.getAttribute("unitsConversionFractionDigits"),
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <CachedValue
        period={period}
        objKey={objKey}
        textAlign="right"
        id={id}
        visible={visible}
        valueKey="range"
        valueCache={valueCache}
        Component={ValueOnDot}
        fractionDigits={chart.getAttribute("unitsConversionFractionDigits")}
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "range", period, objKey, valueCache }),
})

export const volumeColumn = (chart, { period, objKey, valueCache }) => ({
  id: objKey ? `${objKey}-volume` : "volume",
  header: (
    <Flex column>
      <TextMicro>Volume</TextMicro>
      <Units visible />
    </Flex>
  ),
  headerString: () => `Volume (${chart.getUnitSign({ key: "units" })})`,
  size: 60,
  minSize: 60,
  renderString: row =>
    renderValueString(chart, row, {
      key: "volume",
      period,
      objKey,
      valueCache,
      fractionDigits: 1,
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <CachedValue
        period={period}
        objKey={objKey}
        textAlign="right"
        id={id}
        visible={visible}
        valueKey="volume"
        valueCache={valueCache}
        Component={ValueOnDot}
        fractionDigits={1}
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "volume", period, objKey, valueCache }),
})
