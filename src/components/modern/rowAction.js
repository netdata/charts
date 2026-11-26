import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"

const stopPropagation = event => event.stopPropagation()

const stopActivationKeys = event => {
  if (event.key === "Enter" || event.key === " ") event.stopPropagation()
}

const Slot = styled(Flex).attrs({
  as: "span",
  flex: false,
  alignItems: "center",
  margin: [0, 0, 0, 1],
  onClick: stopPropagation,
  onKeyDown: stopActivationKeys,
  "data-testid": "chartRowAction",
})`
  display: inline-flex;
  vertical-align: middle;
`

const labelGroupPrefix = "label:"

const targetsByGroup = {
  dimension: { kind: "dimension" },
  instance: { kind: "instance" },
  node: { kind: "node" },
}

const isPostAggregated = chart =>
  !!chart.getAttribute("showPostAggregations") && !!chart.getAttribute("postGroupBy")?.length

export const getLegendRowTarget = chart => {
  const groups = chart.getDimensionGroups()
  if (groups.length !== 1 || isPostAggregated(chart)) return null

  const [only] = groups
  if (only.startsWith(labelGroupPrefix))
    return { kind: "label", labelKey: only.slice(labelGroupPrefix.length) }

  return targetsByGroup[only] || null
}

const RowAction = ({ row }) => {
  const chart = useChart()
  const Action = useAttributeValue("rowAction")

  if (!Action) return null

  return (
    <Slot>
      <Action chart={chart} row={row} />
    </Slot>
  )
}

export const LegendRowAction = ({ row }) => {
  const chart = useChart()
  const Action = useAttributeValue("rowAction")

  const target = Action && getLegendRowTarget(chart)
  if (!target) return null

  return <RowAction row={{ ...target, id: row.id, name: row.name, value: row.id }} />
}

export default RowAction
