import React from "react"
import { Flex, TextSmall } from "@netdata/netdata-ui"
import Color, { ColorBar } from "@/components/line/dimensions/color"
import Name from "@/components/line/dimensions/name"
import {
  useChart,
  useAttributeValue,
  useVisibleDimensionId,
  getValueByPeriod,
  convert,
} from "@/components/provider"
import Label from "@/components/filterToolbox/label"
import { rowFlavours } from "@/components/line/popover/dimensions"
import ValueWithUnit, { ValueUnitHeader } from "@/components/line/dimensions/valueWithUnit"

const valueColumnSize = 144
const valueColumnMinSize = 120

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
  accessorFn: id => chart.getDimensionName(id),
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
            <ColorBar
              id={id}
              valueKey={rowValueKeys[rowFlavour] || rowValueKeys.default}
              position="absolute"
              top={1}
              left={0}
              backgroundOpacity={0.4}
              round
              height={4}
            >
              <Color id={id} />
            </ColorBar>
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
            textProps={{ color: "textLite" }}
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

const CachedValue = ({
  id,
  visible,
  valueKey = "value",
  period = "latest",
  objKey,
  unitsKey,
  valueCache,
  fractionDigits,
  unit,
  color,
  strong,
}) => {
  const chart = useChart()
  const value = getCachedValue(chart, valueCache, id, {
    key: valueKey,
    period,
    objKey,
  })

  if (!visible) return null

  return (
    <ValueWithUnit
      value={value}
      dimensionId={id}
      valueKey={valueKey}
      unitsKey={unitsKey}
      fractionDigits={fractionDigits}
      unit={unit}
      color={color}
      strong={strong}
    />
  )
}

const renderValueString = (
  chart,
  row,
  {
    key = "value",
    period = "latest",
    objKey,
    unitsKey = "units",
    valueCache,
    fractionDigits,
    unit,
  }
) => {
  const dimensionId = row.original
  const value = getCachedValue(chart, valueCache, dimensionId, { key, period, objKey })
  const unitAttributes =
    unit === undefined && value !== null && value !== "-"
      ? chart.getUnitAttributesForValue(value, { dimensionId, key: unitsKey })
      : undefined
  const convertedValue = convert(chart, value, {
    valueKey: key,
    fractionDigits,
    dimensionId,
    unitsKey,
    unitAttributes,
  })
  const convertedUnit =
    unit === undefined
      ? chart.getUnitSign({ dimensionId, key: unitsKey, unitAttributes })
      : unit

  return convertedUnit ? `${convertedValue} ${convertedUnit}` : convertedValue
}

export const valueColumn = (chart, { valueCache } = {}) => ({
  id: "value",
  header: <ValueUnitHeader label="Value" strong={false} />,
  headerString: () => "Value",
  size: valueColumnSize,
  minSize: valueColumnMinSize,
  renderString: row =>
    renderValueString(chart, row, {
      valueCache,
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return <CachedValue period="latest" id={id} visible={visible} valueCache={valueCache} />
  },
  sortingFn: makeNumberSortingFn(chart, { key: "value", period: "latest", valueCache }),
})

export const anomalyColumn = (chart, { period, objKey, valueCache }) => ({
  id: objKey ? `${objKey}-arp` : "arp",
  header: <ValueUnitHeader label="Anomaly" strong={false} />,
  headerString: () => "Anomaly",
  size: valueColumnSize,
  minSize: valueColumnMinSize,
  renderString: row =>
    renderValueString(chart, row, {
      key: "arp",
      period,
      objKey,
      valueCache,
      fractionDigits: 2,
      unit: "%",
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <CachedValue
        period={period}
        objKey={objKey}
        id={id}
        visible={visible}
        valueKey="arp"
        valueCache={valueCache}
        fractionDigits={2}
        unit="%"
        color="anomalyTextFocus"
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "arp", period, objKey, valueCache }),
})

export const minColumn = (chart, { period, objKey, valueCache }) => ({
  id: objKey ? `${objKey}-min` : "min",
  header: <ValueUnitHeader label="Min" strong={false} />,
  headerString: () => "Min",
  size: valueColumnSize,
  minSize: valueColumnMinSize,
  renderString: row =>
    renderValueString(chart, row, {
      key: "min",
      period,
      objKey,
      valueCache,
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <CachedValue
        period={period}
        objKey={objKey}
        id={id}
        visible={visible}
        valueKey="min"
        valueCache={valueCache}
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "min", period, objKey, valueCache }),
})

export const avgColumn = (chart, { period, objKey, valueCache }) => ({
  id: objKey ? `${objKey}-avg` : "avg",
  header: <ValueUnitHeader label="Avg" strong={false} />,
  headerString: () => "Avg",
  size: valueColumnSize,
  minSize: valueColumnMinSize,
  renderString: row =>
    renderValueString(chart, row, {
      key: "avg",
      period,
      objKey,
      valueCache,
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <CachedValue
        period={period}
        objKey={objKey}
        id={id}
        visible={visible}
        valueKey="avg"
        valueCache={valueCache}
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "avg", period, objKey, valueCache }),
})

export const maxColumn = (chart, { period, objKey, valueCache }) => ({
  id: objKey ? `${objKey}-max` : "max",
  header: <ValueUnitHeader label="Max" strong={false} />,
  headerString: () => "Max",
  size: valueColumnSize,
  minSize: valueColumnMinSize,
  renderString: row =>
    renderValueString(chart, row, {
      key: "max",
      period,
      objKey,
      valueCache,
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <CachedValue
        period={period}
        objKey={objKey}
        id={id}
        visible={visible}
        valueKey="max"
        valueCache={valueCache}
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "max", period, objKey, valueCache }),
})

export const medianColumn = (chart, { period, objKey, valueCache }) => ({
  id: objKey ? `${objKey}-median` : "median",
  header: <ValueUnitHeader label="Median" strong={false} />,
  headerString: () => "Median",
  size: valueColumnSize,
  minSize: valueColumnMinSize,
  renderString: row =>
    renderValueString(chart, row, {
      key: "median",
      period,
      objKey,
      valueCache,
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <CachedValue
        period={period}
        objKey={objKey}
        id={id}
        visible={visible}
        valueKey="median"
        valueCache={valueCache}
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "median", period, objKey, valueCache }),
})

export const stdDevColumn = (chart, { period, objKey, valueCache }) => ({
  id: objKey ? `${objKey}-stddev` : "stddev",
  header: <ValueUnitHeader label="StdDev" strong={false} />,
  headerString: () => "StdDev",
  size: valueColumnSize,
  minSize: valueColumnMinSize,
  renderString: row =>
    renderValueString(chart, row, {
      key: "stddev",
      period,
      objKey,
      valueCache,
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <CachedValue
        period={period}
        objKey={objKey}
        id={id}
        visible={visible}
        valueKey="stddev"
        valueCache={valueCache}
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "stddev", period, objKey, valueCache }),
})

export const p95Column = (chart, { period, objKey, valueCache }) => ({
  id: objKey ? `${objKey}-p95` : "p95",
  header: <ValueUnitHeader label="P95" strong={false} />,
  headerString: () => "95th Percentile",
  size: valueColumnSize,
  minSize: valueColumnMinSize,
  renderString: row =>
    renderValueString(chart, row, {
      key: "p95",
      period,
      objKey,
      valueCache,
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <CachedValue
        period={period}
        objKey={objKey}
        id={id}
        visible={visible}
        valueKey="p95"
        valueCache={valueCache}
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "p95", period, objKey, valueCache }),
})

export const rangeColumn = (chart, { period, objKey, valueCache }) => ({
  id: objKey ? `${objKey}-range` : "range",
  header: <ValueUnitHeader label="Range" strong={false} />,
  headerString: () => "Range",
  size: valueColumnSize,
  minSize: valueColumnMinSize,
  renderString: row =>
    renderValueString(chart, row, {
      key: "range",
      period,
      objKey,
      valueCache,
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <CachedValue
        period={period}
        objKey={objKey}
        id={id}
        visible={visible}
        valueKey="range"
        valueCache={valueCache}
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "range", period, objKey, valueCache }),
})

export const volumeColumn = (chart, { period, objKey, valueCache }) => ({
  id: objKey ? `${objKey}-volume` : "volume",
  header: <ValueUnitHeader label="Volume" strong={false} />,
  headerString: () => "Volume",
  size: valueColumnSize,
  minSize: valueColumnMinSize,
  renderString: row =>
    renderValueString(chart, row, {
      key: "volume",
      period,
      objKey,
      valueCache,
    }),
  cell: ({ row: { original: id } }) => {
    const visible = useVisibleDimensionId(id)

    return (
      <CachedValue
        period={period}
        objKey={objKey}
        id={id}
        visible={visible}
        valueKey="volume"
        valueCache={valueCache}
      />
    )
  },
  sortingFn: makeNumberSortingFn(chart, { key: "volume", period, objKey, valueCache }),
})
