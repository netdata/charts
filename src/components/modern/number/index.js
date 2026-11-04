import React, { useMemo } from "react"
import styled from "styled-components"
import { Flex, Text } from "@netdata/netdata-ui"
import arrowIcon from "@netdata/netdata-ui/dist/components/icon/assets/long_arrow_up.svg"
import Icon from "@/components/icon"
import {
  useAttributeValue,
  useChart,
  useLatestDisplayValueWithUnit,
  useOnResize,
  useVisibleDimensionIds,
} from "@/components/provider"
import { numerals } from "@/components/modern/numerals"
import { formatReadout } from "@/components/modern/format"
import Sparkline from "./sparkline"
import StatusIndicator from "@/components/modern/status"
import { useAttention } from "./attention"
import { useStableChars } from "@/components/modern/tile/readout"
import { useInModernTile } from "@/components/modern/tile/context"
import { useValueFocus } from "@/components/modern/focus"
import { describeWindowChange, isPercentUnit, isWindowActive } from "@/helpers/valueFocus"

const clamp = (value, low, high) => Math.min(Math.max(value, low), high)

export const Numerals = styled(Text).attrs({ whiteSpace: "nowrap" })`
  ${numerals}
  line-height: 1;
`

const BigValue = styled(Numerals)`
  font-weight: 600;
  letter-spacing: -0.01em;
`

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

const stateUnits = new Set(["state", "status", "boolean", "ntp mode"])

export const isStateUnit = units =>
  []
    .concat(units || [])
    .some(unit => stateUnits.has(String(unit).replace(/[{}]/g, "").trim().toLowerCase()))

const safeId = id => String(id).replace(/[^a-zA-Z0-9_-]/g, "-")

const fitFontSize = (width, chars, unitChars) =>
  (width - 24) / (chars * 0.56 + unitChars * 0.2 + 0.3)

const wideTile = 200

const Unit = ({ unit, size }) =>
  !!unit && (
    <Numerals fontSize={`${size}px`} color="textLite" data-testid="modernNumberUnit">
      {unit}
    </Numerals>
  )

const Steady = ({ change, unit, ...rest }) => (
  <Numerals fontSize="12px" color="textLite" data-testid="modernNumberSteady" {...rest}>
    <span>{change.varied ? "now at " : "steady at "}</span>
    <Numerals as="span" fontSize="12px" color="text" strong data-testid="modernNumberValue">
      {change.to}
    </Numerals>
    {!!unit && (
      <Numerals
        as="span"
        fontSize="12px"
        color="text"
        strong
        margin={[0, 0, 0, 1]}
        data-testid="modernNumberUnit"
      >
        {unit}
      </Numerals>
    )}
    {!!change.window && <span>{` · ${change.window}`}</span>}
  </Numerals>
)

const ChangeHero = ({ change, unit, width, height }) => {
  const wide = width >= wideTile

  if (!change.moved)
    return (
      <Flex column gap={1.5} role="img" aria-label={change.label} data-testid="modernNumberHero">
        <Text
          fontSize={`${Math.round(clamp(height * 0.2, 14, 28))}px`}
          color="textLite"
          lineHeight="1"
          whiteSpace="nowrap"
        >
          No change
        </Text>
        <Steady change={change} unit={unit} />
      </Flex>
    )

  const unitChars = unit ? String(unit).length : 0
  const deltaSize = Math.floor(
    clamp(Math.min(fitFontSize(width, change.delta.length + 1, unitChars), height * 0.34), 14, 44)
  )

  return (
    <Flex column gap={2} role="img" aria-label={change.label} data-testid="modernNumberHero">
      <Flex alignItems="center" gap={1.5}>
        <Icon
          svg={arrowIcon}
          width={`${Math.round(deltaSize * 0.5)}px`}
          height={`${Math.round(deltaSize * 0.72)}px`}
          color="text"
          rotate={change.direction === "down" ? 2 : undefined}
          aria-hidden="true"
          data-direction={change.direction}
          data-testid="modernNumberArrow"
        />
        <Flex alignItems="baseline" gap={1}>
          <BigValue fontSize={`${deltaSize}px`} color="text" data-testid="modernNumberDelta">
            {change.delta}
          </BigValue>
          {!isPercentUnit(unit) && (
            <Unit unit={unit} size={Math.max(11, Math.round(deltaSize * 0.38))} />
          )}
        </Flex>
      </Flex>
      <Numerals fontSize="12px" color="textLite" data-testid="modernNumberFromTo">
        <Numerals as="span" fontSize="12px" color="textLite" opacity="medium">
          {change.from}
        </Numerals>
        <span>{wide ? " → now " : " → "}</span>
        <Numerals as="span" fontSize="12px" color="text" strong data-testid="modernNumberValue">
          {change.to}
        </Numerals>
        {wide && !!change.window && <span>{` · ${change.window}`}</span>}
      </Numerals>
    </Flex>
  )
}

const ModernNumber = ({ uiName }) => {
  const chart = useChart()
  const { width, height } = useOnResize(uiName)
  const [dimensionId] = useVisibleDimensionIds()
  const hoverX = useAttributeValue("hoverX")
  const inTile = useInModernTile()
  const focus = useValueFocus("number")

  const { value, convertedUnit: unit, unitAttributes } = useLatestDisplayValueWithUnit(dimensionId)
  const convertedValue = formatReadout(chart, value, { dimensionId, unitAttributes })

  const values = useWindowValues(dimensionId)

  const [rangeMin] = chart.getAttribute("getValueRange")(chart)
  const { alert, color } = useAttention(toFinite(value), rangeMin)

  const hoverIndex = hoverX ? chart.getClosestRow(hoverX[0]) : -1
  const markerIndex = hoverIndex === -1 || hoverIndex === undefined ? values.length - 1 : hoverIndex

  const widest = useStableChars(
    `${dimensionId}|${width}|${height}`,
    String(convertedValue ?? "").length,
    unit ? String(unit).length : 0
  )
  const fit = fitFontSize(width, widest.chars, widest.unitChars)

  const change =
    focus === "totals" || toFinite(value) === null || isStateUnit(chart.getUnits())
      ? null
      : describeWindowChange(chart, values, {
          dimensionId,
          unitAttributes,
          unit,
          index: markerIndex,
        })

  const mode = focus === "trends" ? "trends" : change ? focus : "totals"
  const windowMoved = isWindowActive(values)
  const steadyWindow = !!change && !windowMoved
  const showsSpark = mode === "trends" && (windowMoved || steadyWindow)
  const sparkHeight = showsSpark && height >= 60 ? Math.round(height * 0.6) : 0
  const bigSize =
    mode === "trends"
      ? Math.floor(clamp(Math.min(fit, height * 0.14), 12, 22))
      : Math.floor(clamp(Math.min(fit, height * 0.42), 12, 56))
  const unitSize = Math.max(11, Math.round(bigSize * 0.36))

  const seriesColor = color || (dimensionId ? chart.selectDimensionColor(dimensionId) : undefined)

  return (
    <Flex
      column
      width="100%"
      height="100%"
      justifyContent="between"
      overflow="hidden"
      data-testid="modernNumber"
      data-focus={mode}
    >
      <Flex
        column
        gap={1}
        padding={[2, inTile ? 0 : 3, sparkHeight ? 1 : 2]}
        flex
        justifyContent={mode === "trends" ? "start" : "center"}
      >
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
        {mode === "changes" && (
          <ChangeHero change={change} unit={unit} width={width} height={height} />
        )}
        {mode === "trends" && steadyWindow && <Steady change={change} unit={unit} />}
        {(mode === "totals" || (mode === "trends" && !steadyWindow)) && (
          <Flex alignItems="baseline" gap={2} flexWrap>
            <Flex alignItems="baseline" gap={1} overflow="hidden">
              <BigValue
                fontSize={`${bigSize}px`}
                color={color || "text"}
                data-testid="modernNumberValue"
              >
                {convertedValue}
              </BigValue>
              <Unit unit={unit} size={unitSize} />
            </Flex>
            {!!change && (
              <Numerals
                fontSize="12px"
                color="textLite"
                title={change.detail}
                aria-label={change.label}
                data-testid="modernNumberDelta"
              >
                {change.moved ? (
                  <>
                    <Numerals as="span" fontSize="12px" color="text" strong>
                      {change.delta}
                    </Numerals>
                    <span>{change.text.slice(change.delta.length)}</span>
                  </>
                ) : (
                  <span>{change.text}</span>
                )}
              </Numerals>
            )}
          </Flex>
        )}
      </Flex>
      {sparkHeight > 0 && (
        <Sparkline
          values={values}
          color={seriesColor}
          id={safeId(chart.getId())}
          height={sparkHeight}
          markerIndex={markerIndex}
          flat={steadyWindow}
        />
      )}
    </Flex>
  )
}

export default ModernNumber
