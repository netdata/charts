import React, { memo, useMemo } from "react"
import styled from "styled-components"
import { Flex, TextMicro, TextSmall, getColor } from "@netdata/netdata-ui"
import {
  useChart,
  useAttributeValue,
  usePayload,
  useLatestValue,
  useLatestDisplayValue,
  useUnitSign,
  useVisibleDimensionId,
} from "@/components/provider"
import Value, { Value as ValuePart } from "@/components/line/dimensions/value"
import getWindowRange from "@/helpers/getWindowRange"
import { labels as annotationLabels } from "@/helpers/annotations"
import Tooltip from "@/components/tooltip"
import { numeralsFont, tabularNumbers, radius } from "@/components/modern/tokens"
import { formatReadout } from "@/components/modern/format"

const rowHeight = 24
const emptyArray = [null, null]

const rowSorting = {
  ANOMALY_RATE: "anomalyDesc",
  ANNOTATIONS: "annotationsDesc",
}

export const getSort = (row, dimensionsSort) =>
  rowSorting[row] ||
  (!dimensionsSort || dimensionsSort === "default" ? "valueDesc" : dimensionsSort)

const getMaxRows = height => {
  if (!height) return 20
  const rows = Math.floor((height - 24) / rowHeight)
  return rows < 2 ? 2 : rows
}

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(64px, 36%) minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-height: 20px;
  opacity: ${({ $faded }) => ($faded ? 0.45 : 1)};
`

const Track = styled.div`
  height: 10px;
  border-radius: 3px;
  background: ${getColor("borderSecondary")};
  overflow: hidden;
`

const Fill = styled.div`
  height: 100%;
  border-radius: 3px;
  background: ${({ $color }) => $color};
  opacity: ${({ $emphasis }) => ($emphasis ? 1 : 0.6)};
  transition: width 150ms ease-out;
`

const Numeral = styled(TextSmall)`
  font-family: ${numeralsFont};
  ${tabularNumbers}
`

const getPercent = (value, min, max) => {
  const minAbs = Math.abs(min)
  const maxAbs = Math.abs(max)
  const from = max > 0 ? (min < 0 ? 0 : min) : maxAbs
  const to = maxAbs > minAbs ? maxAbs : minAbs
  if (!value || to === from) return 0
  const percent = ((Math.abs(value) - from) * 100) / (to - from)
  return percent < 0 ? 0 : percent > 100 ? 100 : percent
}

const Bar = ({ id, emphasis }) => {
  const chart = useChart()
  const value = useLatestValue(id) || 0
  const min = useAttributeValue("min")
  const max = useAttributeValue("max")

  return (
    <Track data-testid="modern-bars-track">
      <Fill
        $color={chart.selectDimensionColor(id)}
        $emphasis={emphasis}
        style={{ width: `${getPercent(value, min, max)}%` }}
        data-testid="modern-bars-fill"
      />
    </Track>
  )
}

const DisplayValue = ({ id, strong }) => {
  const chart = useChart()
  const value = useLatestDisplayValue(id, { allowNull: true })
  const convertedUnit = useUnitSign({ dimensionId: id })
  const convertedValue = formatReadout(chart, value, { dimensionId: id })

  return (
    <Flex alignItems="baseline" justifyContent="end" gap={1}>
      <Numeral color="text" strong={strong} whiteSpace="nowrap" data-testid="modern-bars-value">
        {convertedValue}
      </Numeral>
      {!!convertedUnit && (
        <TextMicro color="textLite" whiteSpace="nowrap">
          {convertedUnit}
        </TextMicro>
      )}
    </Flex>
  )
}

const AnomalyValue = ({ children, ...rest }) =>
  children && children !== "-" ? (
    <Tooltip content="Anomaly rate">
      <ValuePart color="anomalyText" whiteSpace="nowrap" {...rest}>
        {`${children}%`}
      </ValuePart>
    </Tooltip>
  ) : null

export const pillInk = "#1C1E22"

const Pill = styled.span`
  font-size: 10px;
  font-weight: 600;
  line-height: 14px;
  padding: 0 6px;
  border-radius: ${radius.pill};
  color: ${pillInk};
  background: ${({ $color }) => $color};
`

const Annotations = ({ children: annotations }) =>
  annotations && Object.keys(annotations).length ? (
    <Flex gap={0.5}>
      {Object.keys(annotations).map(ann => (
        <Tooltip key={ann} content={annotationLabels[ann] || ann}>
          <Pill $color={annotations[ann]} data-testid="modern-bars-annotation">
            {ann}
          </Pill>
        </Tooltip>
      ))}
    </Flex>
  ) : null

const BarRow = ({ id, rank, strong, fullCols }) => {
  const chart = useChart()
  const visible = useVisibleDimensionId(id)

  return (
    <Row $faded={!visible} data-testid="modern-bars-row">
      <TextSmall color="text" strong={strong} truncate title={chart.getDimensionName(id)}>
        {chart.getDimensionName(id)}
      </TextSmall>
      <Bar id={id} emphasis={rank === 0} />
      <Flex alignItems="center" justifyContent="end" gap={1}>
        {visible && <DisplayValue id={id} strong={strong || rank === 0} />}
        {fullCols && (
          <Value
            id={id}
            visible={visible}
            valueKey="arp"
            fractionDigits={2}
            Component={AnomalyValue}
          />
        )}
        {fullCols && <Value id={id} visible={visible} valueKey="pa" Component={Annotations} />}
      </Flex>
    </Row>
  )
}

const More = ({ count, direction }) =>
  count > 0 ? (
    <TextMicro color="textLite" data-testid="modern-bars-more">
      {direction === "up" ? `↑${count} more values` : `↓${count} more values`}
    </TextMicro>
  ) : null

const ModernBars = ({ height }) => {
  const chart = useChart()
  const [x, row] = useAttributeValue("hoverX") || emptyArray
  const dimensionsSort = useAttributeValue("dimensionsSort")
  const cols = useAttributeValue("cols")
  const { data } = usePayload()

  const [from, to, total, ids] = useMemo(() => {
    const index = chart.getClosestRow(x) || data.length - 1

    let dimensionIds = chart.onHoverSortDimensions(index, getSort(row, dimensionsSort)) || []

    if (chart.getAttribute("selectedDimensions").length > 0) {
      dimensionIds = dimensionIds.filter(id => chart.isDimensionVisible(id))
    }

    const total = dimensionIds.length
    const { from, to } = getWindowRange({
      total,
      index: dimensionIds.findIndex(id => id === row),
      limit: getMaxRows(height),
    })

    return [from, to, total, dimensionIds.slice(from, to)]
  }, [chart, row, x, data, height, dimensionsSort])

  return (
    <Flex column gap={1} width="100%" padding={[1, 2]} data-testid="modern-bars">
      <More count={from} direction="up" />
      {ids.map((id, index) => (
        <BarRow
          key={id}
          id={id}
          rank={from + index}
          strong={row === id}
          fullCols={cols === "full"}
        />
      ))}
      <More count={total - to} direction="down" />
    </Flex>
  )
}

export default memo(ModernBars)
