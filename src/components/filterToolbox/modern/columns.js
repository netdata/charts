import React from "react"
import { Flex, Box, TextSmall, TextMicro } from "@netdata/netdata-ui"
import Units from "@/components/line/dimensions/units"
import { useChart, useConverted } from "@/components/provider"
import { LineSwatch } from "@/components/modern/swatch"
import { SmallNumeral } from "@/components/modern/numerals"
import { Dot } from "@/components/modern/dot"
import { radius } from "@/components/modern/tokens"
import Label from "../label"
import { useMetricsByValue } from "../columns"
import { formatPercent, clampPercent } from "./format"

const Head = ({ children, align = "start" }) => (
  <Flex justifyContent={align} alignItems="center" gap={1} width="100%" overflow="hidden">
    <TextMicro color="textDescription" whiteSpace="nowrap" truncate>
      {children}
    </TextMicro>
  </Flex>
)

const NumericHead = ({ children }) => <Head align="end">{children}</Head>

const StatHead = ({ children }) => (
  <Flex justifyContent="end" alignItems="baseline" gap={0.5} width="100%" overflow="hidden">
    <TextMicro color="textDescription" whiteSpace="nowrap">
      {children}
    </TextMicro>
    <Units visible color="textLite" />
  </Flex>
)

const hasStats = row => !!row.original.info?.sts

const NameCell = ({ getValue, row, column }) => {
  const chart = useChart()
  const metricsByValue = useMetricsByValue(chart)
  const name = getValue()
  const { fallbackExpandKey, showColor } = column.columnDef

  return (
    <Flex
      justifyContent="between"
      alignItems="center"
      gap={1}
      padding={[0, 0, 0, row.depth * 3]}
      width="100%"
    >
      <Flex gap={1} alignItems="center" overflow="hidden">
        {showColor && <LineSwatch swatchColor={chart.selectDimensionColor(name)} />}
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
    <Flex alignItems="center" gap={2} width="100%" data-testid="modern-filter-share">
      <Flex flex height={1} round={radius.pill} background="borderSecondary" overflow="hidden">
        <Box height="100%" width={`${clampPercent(value)}%`} background="textLite" />
      </Flex>
      <Flex flex={false} justifyContent="end" width={8}>
        <SmallNumeral color="textDescription" whiteSpace="nowrap">
          {formatPercent(value)}
        </SmallNumeral>
      </Flex>
    </Flex>
  )
}

const AnomalyCell = ({ getValue, row }) => {
  const value = getValue()
  if (!hasStats(row)) return <TextSmall color="textLite">{value}</TextSmall>

  return (
    <Flex justifyContent="end" width="100%" data-testid="modern-filter-anomaly">
      <SmallNumeral color={value ? "anomalyText" : "textLite"} whiteSpace="nowrap">
        {formatPercent(value)}
      </SmallNumeral>
    </Flex>
  )
}

const StatCell = ({ getValue }) => {
  const value = useConverted(getValue())

  return (
    <Flex justifyContent="end" width="100%">
      <SmallNumeral color="textLite" whiteSpace="nowrap">
        {value}
      </SmallNumeral>
    </Flex>
  )
}

const CountCell = ({ getValue }) => (
  <Flex justifyContent="end" width="100%">
    <SmallNumeral color="textLite" whiteSpace="nowrap">
      {getValue()}
    </SmallNumeral>
  </Flex>
)

const alertDots = [
  { key: "cr", background: "error", name: "critical" },
  { key: "wr", background: "warning", name: "warning" },
  { key: "cl", background: "success", name: "clear" },
]

const AlertsCell = ({ getValue, row }) => {
  const al = row.original.info?.al
  if (!al) return <TextSmall color="textLite">{getValue()}</TextSmall>

  return (
    <Flex justifyContent="end" gap={2} width="100%" data-testid="modern-filter-alerts">
      {alertDots.map(({ key, background, name }) =>
        al[key] ? (
          <Flex
            key={key}
            alignItems="center"
            gap={1}
            title={`${al[key]} ${name}`}
            data-testid={`modern-filter-alerts-${name}`}
          >
            <Dot background={background} />
            <SmallNumeral color="textDescription">{al[key]}</SmallNumeral>
          </Flex>
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

const statHeaders = {
  min: "Min",
  avg: "Avg",
  max: "Max",
  range: "Range",
}

const fixed = { fullWidth: false, numeric: true }

export const modernizeColumns = (columns, { nameHeader = "Name", showColor = false } = {}) =>
  columns.map(column => {
    switch (column.id) {
      case "label":
        return {
          ...column,
          header: () => <Head>{nameHeader}</Head>,
          cell: NameCell,
          fullWidth: true,
          showColor,
        }
      case "contribution":
        return {
          ...column,
          ...fixed,
          header: () => <NumericHead>Share of volume</NumericHead>,
          headerString: "Share of volume",
          cell: ShareCell,
          size: 140,
        }
      case "anomalyRate":
        return {
          ...column,
          ...fixed,
          header: () => <NumericHead>Anomaly</NumericHead>,
          headerString: "Anomaly",
          cell: AnomalyCell,
          size: 72,
        }
      case "alerts":
        return {
          ...column,
          ...fixed,
          header: () => <NumericHead>Alerts</NumericHead>,
          headerString: "Alerts",
          cell: AlertsCell,
          size: 88,
        }
      case "unique":
        return {
          ...column,
          ...fixed,
          header: () => <NumericHead>{plainHeaders.unique}</NumericHead>,
          headerString: plainHeaders.unique,
          cell: CountCell,
          size: 64,
        }
      case "instances":
      case "metrics":
        return {
          ...column,
          ...fixed,
          numeric: false,
          header: () => <Head>{plainHeaders[column.id]}</Head>,
          headerString: plainHeaders[column.id],
          size: 88,
        }
      default:
        return statHeaders[column.id]
          ? {
              ...column,
              ...fixed,
              header: () => <StatHead>{statHeaders[column.id]}</StatHead>,
              headerString: statHeaders[column.id],
              cell: StatCell,
              size: 80,
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
