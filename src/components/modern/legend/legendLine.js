import React from "react"
import styled from "styled-components"
import { getColor } from "@netdata/netdata-ui"
import { useChart } from "@/components/provider"
import { useIsHeatmap } from "@/helpers/heatmap"
import { AnomalyBar, Flags, Numeral, Swatch, onToggle } from "./parts"
import { focusDimension, useClearFocusOnUnmount } from "./mode"
import { useLegendRows } from "./useLegendRows"

const Line = styled.div.attrs({ "data-testid": "modernLegend-line" })`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
  min-width: 0;
  max-height: 64px;
  overflow-y: auto;
`

const Entry = styled.button.attrs({ type: "button", "data-testid": "modernLegend-entry" })`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  line-height: 18px;
  opacity: ${({ $off }) => ($off ? 0.4 : 1)};
`

const Name = styled.span`
  color: ${getColor("textLite")};
  white-space: nowrap;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Value = styled(Numeral)`
  color: ${getColor("text")};
  font-weight: 600;
`

const Unit = styled.span`
  color: ${getColor("textDescription")};
  font-size: 11px;
`

const LegendLine = () => {
  const chart = useChart()
  const { rows } = useLegendRows()
  useClearFocusOnUnmount()
  const isHeatmap = useIsHeatmap()

  return (
    <Line data-track={chart.track("legend")}>
      {rows.map(row => (
        <Entry
          key={row.id}
          $off={!row.visible}
          onClick={onToggle(chart, row.id)}
          onMouseEnter={() => row.visible && focusDimension(chart, row.id)}
          onMouseLeave={() => focusDimension(chart, null)}
          data-track={chart.track(`dimension-${row.name}`)}
          data-dimension={row.id}
          title={row.name}
        >
          {!isHeatmap && <Swatch $color={row.color} />}
          <Name>{row.name}</Name>
          {row.visible && <Value>{row.display}</Value>}
          {row.visible && !!row.unit && <Unit>{row.unit}</Unit>}
          {row.visible && <Flags flags={row.flags} />}
          {row.visible && row.arp > 0 && <AnomalyBar $rate={row.arp} />}
        </Entry>
      ))}
    </Line>
  )
}

export default LegendLine
