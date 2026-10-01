import React from "react"
import styled from "styled-components"
import { Flex, TextSmall, TextMicro, Pill, getColor } from "@netdata/netdata-ui"
import Color from "@/components/line/dimensions/color"
import { useChart } from "@/components/provider"
import { numeralsFont, tabularNumbers } from "@/components/modern/tokens"
import Label from "../label"
import { useMetricsByValue } from "../columns"
import { formatPercent, clampPercent } from "./format"

export const Numeral = styled(TextMicro)`
  font-family: ${numeralsFont};
  ${tabularNumbers}
  white-space: nowrap;
`

const ShareText = styled(Numeral)`
  width: 36px;
  flex-shrink: 0;
  text-align: right;
`

const Track = styled.span`
  flex: 1;
  height: 5px;
  min-width: 24px;
  border-radius: 3px;
  background: ${getColor("borderSecondary")};
  overflow: hidden;
`

const Fill = styled.span`
  display: block;
  height: 100%;
  border-radius: 3px;
  background: ${getColor("textLite")};
`

const Head = ({ children }) => (
  <TextMicro color="textDescription" whiteSpace="nowrap">
    {children}
  </TextMicro>
)

const hasStats = row => !!row.original.info?.sts

const NameCell = ({ getValue, row, column }) => {
  const chart = useChart()
  const metricsByValue = useMetricsByValue(chart)
  const name = getValue()
  const { fallbackExpandKey } = column.columnDef

  return (
    <Flex
      justifyContent="between"
      alignItems="center"
      gap={1}
      padding={[0, 0, 0, row.depth * 3]}
      width="100%"
    >
      <Flex gap={1} alignItems="center" overflow="hidden">
        <Color id={name} />
        <TextSmall
          title={typeof name === "string" ? name : undefined}
          onClick={
            !row.original.disabled
              ? e => {
                  e.preventDefault()
                  e.stopPropagation()
                  row.getToggleSelectedHandler()(e)
                }
              : undefined
          }
          cursor={row.original.disabled ? "default" : "pointer"}
          whiteSpace="nowrap"
          truncate
        >
          {name}
        </TextSmall>
      </Flex>
      {row.getCanExpand() && (
        <Label
          label={
            metricsByValue[name] || metricsByValue[fallbackExpandKey] || metricsByValue.default
          }
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            row.getToggleExpandedHandler()(e)
            setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "nearest" }))
          }}
          iconRotate={row.getIsExpanded() ? 2 : null}
          textProps={{ fontSize: "10px", color: "textLite" }}
          alignItems="center"
          width="auto"
        />
      )}
    </Flex>
  )
}

const ShareCell = ({ getValue, row }) => {
  const value = getValue()
  if (!hasStats(row)) return <TextSmall color="textLite">{value}</TextSmall>

  return (
    <Flex alignItems="center" gap={1.5} width="100%" data-testid="modern-filter-share">
      <Track>
        <Fill style={{ width: `${clampPercent(value)}%` }} />
      </Track>
      <ShareText color="textDescription">{formatPercent(value)}</ShareText>
    </Flex>
  )
}

const AnomalyCell = ({ getValue, row }) => {
  const value = getValue()
  if (!hasStats(row)) return <TextSmall color="textLite">{value}</TextSmall>

  return (
    <Flex justifyContent="end" width="100%" data-testid="modern-filter-anomaly">
      <Numeral color={value ? "anomalyText" : "textLite"}>{formatPercent(value)}</Numeral>
    </Flex>
  )
}

const alertPills = [
  { key: "cr", flavour: "error", name: "critical" },
  { key: "wr", flavour: "warning", name: "warning" },
  { key: "cl", flavour: "clear", name: "clear", hollow: true },
]

const AlertsCell = ({ getValue, row }) => {
  const al = row.original.info?.al
  if (!al) return <TextSmall color="textLite">{getValue()}</TextSmall>

  return (
    <Flex justifyContent="end" gap={0.5} width="100%" data-testid="modern-filter-alerts">
      {alertPills.map(({ key, flavour, name, hollow }) =>
        al[key] ? (
          <Pill
            key={key}
            flavour={flavour}
            hollow={hollow}
            tiny
            title={`${al[key]} ${name}`}
            data-testid={`modern-filter-alerts-${name}`}
          >
            {al[key]}
          </Pill>
        ) : null
      )}
    </Flex>
  )
}

const plainHeaders = {
  unique: "Unique",
  instances: "Instances",
  metrics: "Metrics",
}

export const modernizeColumns = (columns, { nameHeader = "Name" } = {}) =>
  columns.map(column => {
    switch (column.id) {
      case "label":
        return { ...column, header: () => <Head>{nameHeader}</Head>, cell: NameCell }
      case "contribution":
        return {
          ...column,
          header: () => <Head>Share of volume</Head>,
          headerString: "Share of volume",
          cell: ShareCell,
          size: 120,
        }
      case "anomalyRate":
        return {
          ...column,
          header: () => <Head>Anomaly</Head>,
          headerString: "Anomaly",
          cell: AnomalyCell,
          size: 72,
        }
      case "alerts":
        return {
          ...column,
          header: () => <Head>Alerts</Head>,
          headerString: "Alerts",
          cell: AlertsCell,
          size: 84,
        }
      default:
        return plainHeaders[column.id]
          ? {
              ...column,
              header: () => <Head>{plainHeaders[column.id]}</Head>,
              headerString: plainHeaders[column.id],
            }
          : column
    }
  })

export const columnNames = {
  unique: "Unique",
  instances: "Instances",
  metrics: "Metrics",
  contribution: "Share of volume",
  anomalyRate: "Anomaly",
  alerts: "Alerts",
  min: "Min",
  avg: "Avg",
  max: "Max",
  range: "Range",
}

export const defaultHiddenColumns = {
  unique: false,
  instances: false,
  metrics: false,
  min: false,
  avg: false,
  max: false,
  range: false,
}
