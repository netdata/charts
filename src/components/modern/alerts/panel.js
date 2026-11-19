import styled from "styled-components"
import { Box, Flex, TextMicro } from "@netdata/netdata-ui"
import { useAttribute, useAttributeValue, useChart } from "@/components/provider"
import { Dot } from "@/components/modern/dot"
import { Divider, Item, MenuHeading, MenuScroll } from "@/components/modern/menu"
import { panelDrillPrefix } from "@/components/modern/header/moreMenu"
import { parseThresholds } from "./parseThreshold"
import { describeCounts, isRaised, toAlertRows } from "./rows"

export const thresholdOverlayId = "alertThreshold"

export const findAlertRow = (rows, path = []) =>
  path.length ? rows.find(row => row.name === path.at(-1)) : undefined

const dotColors = { critical: "error", warning: "warning", clear: "success", other: "textLite" }
const countColors = { critical: "error", warning: "warning" }
const levelLabels = { warning: "Warning", critical: "Critical" }

const Name = styled(Box).attrs({ as: "span", overflow: "hidden" })`
  text-overflow: ellipsis;
  white-space: nowrap;
`

const StatusDot = ({ status }) => <Dot size={2} background={dotColors[status]} />

const AlertRow = ({ row, onSelect }) => (
  <Item
    icon={<StatusDot status={row.status} />}
    hint={
      <Box as="span" color={countColors[row.status] || "textLite"}>
        {describeCounts(row)}
      </Box>
    }
    drill
    aria-haspopup="menu"
    title={row.name}
    data-menu-id={`${panelDrillPrefix}${row.name}`}
    data-testid="chartAlerts-row"
    data-alert={row.name}
    data-status={row.status}
    onClick={() => onSelect(row.name)}
  >
    <Name>{row.name}</Name>
  </Item>
)

const ActionItems = ({ actions }) =>
  actions.map(({ id, label, hint, disabled, onClick }) => (
    <Item
      key={id}
      hint={hint}
      disabled={disabled}
      data-testid={`chartAlerts-${id}`}
      onClick={onClick}
    >
      {label}
    </Item>
  ))

const ListView = ({ rows, onSelect, chartActions }) => {
  const raised = rows.filter(isRaised)
  const watching = rows.filter(row => !isRaised(row))

  return (
    <>
      {!rows.length && (
        <TextMicro color="textLite" padding={[1, 2]} data-testid="chartAlerts-empty">
          No alert watches the metrics on this chart
        </TextMicro>
      )}
      <MenuScroll height={{ max: "260px" }}>
        {!!raised.length && <MenuHeading>Raised</MenuHeading>}
        {raised.map(row => (
          <AlertRow key={row.name} row={row} onSelect={onSelect} />
        ))}
        {!!watching.length && <MenuHeading>Watching</MenuHeading>}
        {watching.map(row => (
          <AlertRow key={row.name} row={row} onSelect={onSelect} />
        ))}
      </MenuScroll>
      {!!chartActions.length && (
        <>
          {!!rows.length && <Divider />}
          <ActionItems actions={chartActions} />
        </>
      )}
    </>
  )
}

const formatLevel = (chart, value) => {
  const dimensionId = (chart.getVisibleDimensionIds() || [])[0]
  const unitAttributes = chart.getUnitAttributesForValue(value, { dimensionId })
  return chart.getConvertedValueWithUnit(value, { dimensionId, unitAttributes })
}

const describeLevels = (chart, { direction, ...levels }) =>
  ["warning", "critical"]
    .filter(level => Number.isFinite(levels[level]))
    .map(level => `${levelLabels[level]} ${direction} ${formatLevel(chart, levels[level])}`)
    .join(" · ")

const getUnavailableReason = ({ chartLibrary, definition, thresholds }) => {
  if (chartLibrary !== "uplot") return "Not on this renderer"
  if (definition.loading) return "Loading…"
  if (!thresholds) return "Not a fixed level"
  if (!definition.plotted) return "Measures another value"
  return null
}

const useLevelsToggle = (name, thresholds) => {
  const [overlays, setOverlays] = useAttribute("overlays")
  const shown = overlays?.[thresholdOverlayId]?.alert === name

  const toggle = () => {
    const rest = Object.fromEntries(
      Object.entries(overlays || {}).filter(([key]) => key !== thresholdOverlayId)
    )
    setOverlays(
      shown
        ? rest
        : { ...rest, [thresholdOverlayId]: { type: "threshold", alert: name, ...thresholds } }
    )
  }

  return { shown, toggle }
}

const DetailView = ({ row, useAlertDefinition, useAlertActions, onClose }) => {
  const chart = useChart()
  const chartLibrary = useAttributeValue("chartLibrary")
  const definition = useAlertDefinition({ chart, name: row.name }) || {}
  const thresholds = definition.loading ? null : parseThresholds(definition)
  const reason = getUnavailableReason({ chartLibrary, definition, thresholds })
  const actions = useAlertActions({ chart, name: row.name, row, onClose }) || []
  const { shown, toggle } = useLevelsToggle(row.name, thresholds)

  return (
    <>
      <Flex column gap={0.5} padding={[1, 2]} data-testid="chartAlerts-detail">
        <Flex alignItems="center" gap={1.5}>
          <StatusDot status={row.status} />
          <TextMicro color={countColors[row.status] || "textLite"}>{describeCounts(row)}</TextMicro>
        </Flex>
        {thresholds && (
          <TextMicro color="text" data-testid="chartAlerts-levels">
            {describeLevels(chart, thresholds)}
          </TextMicro>
        )}
        {!!definition.evaluates && <TextMicro color="textLite">{definition.evaluates}</TextMicro>}
      </Flex>
      <Item
        check={shown && !reason}
        disabled={!!reason}
        hint={reason || undefined}
        data-testid="chartAlerts-showLevels"
        onClick={toggle}
      >
        Show levels on chart
      </Item>
      {!!actions.length && <Divider />}
      <ActionItems actions={actions} />
    </>
  )
}

const noActions = () => []
const noDefinition = () => null

export const makeAlertsPanel = ({
  useAlertActions = noActions,
  useChartActions = noActions,
  useAlertDefinition = noDefinition,
} = {}) => {
  const AlertsPanel = ({ path = [], onDrill, onClose }) => {
    const chart = useChart()
    const rows = toAlertRows(useAttributeValue("alerts"))
    const row = findAlertRow(rows, path)
    const chartActions = useChartActions({ chart, onClose }) || []

    return (
      <Flex column data-testid="chartAlerts-panel">
        {row ? (
          <DetailView
            key={row.name}
            row={row}
            onClose={onClose}
            useAlertDefinition={useAlertDefinition}
            useAlertActions={useAlertActions}
          />
        ) : (
          <ListView rows={rows} onSelect={onDrill} chartActions={chartActions} />
        )}
      </Flex>
    )
  }

  return AlertsPanel
}
