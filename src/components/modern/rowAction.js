import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"

const stopPropagation = event => event.stopPropagation()

const Slot = styled(Flex).attrs({
  as: "span",
  flex: false,
  alignItems: "center",
  margin: [0, 0, 0, 1],
  onClick: stopPropagation,
  "data-testid": "chartRowAction",
})`
  display: inline-flex;
  vertical-align: middle;
`

export const getLegendRowTarget = chart => {
  const groupBy = chart.getAttribute("groupBy") || []
  if (groupBy.length !== 1) return { kind: "dimension" }

  const [only] = groupBy
  if (only === "label") return { kind: "label", labelKey: chart.getAttribute("groupByLabel")?.[0] }
  if (only === "instance" || only === "node") return { kind: only }

  return { kind: "dimension" }
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

  return (
    <RowAction row={{ ...getLegendRowTarget(chart), id: row.id, name: row.name, value: row.id }} />
  )
}

export default RowAction
