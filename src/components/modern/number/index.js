import React, { useMemo } from "react"
import styled from "styled-components"
import { Flex, Text } from "@netdata/netdata-ui"
import {
  useAttributeValue,
  useChart,
  useLatestDisplayValueWithUnit,
  useOnResize,
  useVisibleDimensionIds,
} from "@/components/provider"
import { numeralsFont } from "@/components/modern/tokens"
import { formatReadout } from "@/components/modern/format"
import Sparkline from "./sparkline"
import StatusIndicator from "@/components/modern/status"
import { useAttention } from "./attention"

const clamp = (value, low, high) => Math.min(Math.max(value, low), high)

export const Numerals = styled(Text)`
  font-family: ${numeralsFont};
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
  font-size: ${({ $size }) => $size}px;
`

const BigValue = styled(Numerals)`
  font-weight: 600;
  letter-spacing: -0.01em;
`

export const AttentionPill = ({ alert, ...rest }) => (
  <StatusIndicator
    status={alert.level}
    count={alert.count}
    names={alert.names}
    data-testid="modernAttentionPill"
    {...rest}
  />
)

const toFinite = value => (typeof value === "number" && isFinite(value) ? value : null)

export const useWindowValues = dimensionId => {
  const chart = useChart()
  const payload = chart.getPayload()
  const visible = useVisibleDimensionIds()
  const visibleKey = visible.join(",")

  return useMemo(() => {
    if (!dimensionId || !payload?.all?.length) return []

    return payload.all.map((_, index) =>
      toFinite(chart.getDimensionValue(dimensionId, index, { abs: false }))
    )
  }, [chart, payload, dimensionId, visibleKey])
}

export const getMean = values => {
  const numbers = values.filter(value => value !== null)
  if (!numbers.length) return null
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length
}

const stateUnits = new Set(["state", "status", "boolean", "ntp mode"])

export const isStateUnit = units =>
  []
    .concat(units || [])
    .some(unit => stateUnits.has(String(unit).replace(/[{}]/g, "").trim().toLowerCase()))

const safeId = id => String(id).replace(/[^a-zA-Z0-9_-]/g, "-")

const ModernNumber = ({ uiName }) => {
  const chart = useChart()
  const { width, height } = useOnResize(uiName)
  const [dimensionId] = useVisibleDimensionIds()
  const hoverX = useAttributeValue("hoverX")

  const { value, convertedUnit: unit, unitAttributes } = useLatestDisplayValueWithUnit(dimensionId)
  const convertedValue = formatReadout(chart, value, { dimensionId, unitAttributes })

  const values = useWindowValues(dimensionId)
  const mean = getMean(values)
  const delta = toFinite(value) !== null && mean !== null ? value - mean : null
  const convertedDelta =
    delta === null ? "-" : formatReadout(chart, Math.abs(delta), { dimensionId, unitAttributes })

  const [rangeMin] = chart.getAttribute("getValueRange")(chart)
  const { alert, color } = useAttention(toFinite(value), rangeMin)

  const hoverIndex = hoverX ? chart.getClosestRow(hoverX[0]) : -1
  const markerIndex = hoverIndex === -1 || hoverIndex === undefined ? values.length - 1 : hoverIndex

  const chars = String(convertedValue ?? "").length
  const unitChars = unit ? String(unit).length : 0
  const fit = (width - 24) / (chars * 0.56 + unitChars * 0.2 + 0.3)
  const bigSize = Math.floor(clamp(Math.min(fit, height * 0.32), 12, 44))
  const unitSize = Math.max(11, Math.round(bigSize * 0.36))
  const sparkHeight = height >= 80 ? Math.round(clamp(height * 0.3, 18, 64)) : 0

  const deltaText =
    delta === null || convertedDelta === "-" || isStateUnit(chart.getUnits())
      ? ""
      : `${delta >= 0 ? "+" : "−"}${convertedDelta} vs mean`

  const seriesColor = color || chart.selectDimensionColor(dimensionId)

  return (
    <Flex
      column
      width="100%"
      height="100%"
      justifyContent="between"
      overflow="hidden"
      data-testid="modernNumber"
    >
      <Flex column gap={1} padding={[2, 3, sparkHeight ? 1 : 2]} flex justifyContent="center">
        {!!alert && (
          <Flex justifyContent="end">
            <StatusIndicator
              status={alert.level}
              count={alert.count}
              names={alert.names}
              data-testid="modernNumberStatus"
            />
          </Flex>
        )}
        <Flex alignItems="baseline" justifyContent="between" gap={2} flexWrap>
          <Flex alignItems="baseline" gap={1} overflow="hidden">
            <BigValue $size={bigSize} color={color || "text"} data-testid="modernNumberValue">
              {convertedValue}
            </BigValue>
            {!!unit && (
              <Numerals $size={unitSize} color="textLite" data-testid="modernNumberUnit">
                {unit}
              </Numerals>
            )}
          </Flex>
          {!!deltaText && (
            <Numerals $size={12} color={color || "textLite"} data-testid="modernNumberDelta">
              {deltaText}
            </Numerals>
          )}
        </Flex>
      </Flex>
      {sparkHeight > 0 && (
        <Sparkline
          values={values}
          color={seriesColor}
          id={safeId(chart.getId())}
          height={sparkHeight}
          markerIndex={markerIndex}
        />
      )}
    </Flex>
  )
}

export default ModernNumber
