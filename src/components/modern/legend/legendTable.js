import React, { useLayoutEffect, useRef, useState } from "react"
import styled from "styled-components"
import { getColor } from "@netdata/netdata-ui"
import { useAttributeValue, useChart, useFormatTime } from "@/components/provider"
import { useIsHeatmap } from "@/helpers/heatmap"
import { tabularNumbers } from "@/components/modern/tokens"
import { AnomalyBar, Flags, Numeral, Swatch, onToggle } from "./parts"
import { focusDimension, useClearFocusOnUnmount } from "./mode"
import { useLegendRows } from "./useLegendRows"

const Wrapper = styled.div.attrs({ "data-testid": "modernLegend-table" })`
  position: relative;
  flex: 0 0 40%;
  min-width: 240px;
  max-width: 420px;
  min-height: 0;
  display: flex;
  flex-direction: column;
`

const ScrollArea = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
`

const Scroller = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
`

const Fade = styled.div.attrs({ "data-testid": "modernLegend-fade" })`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 36px;
  pointer-events: none;
  background: linear-gradient(transparent, ${getColor("mainChartBg")});
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  ${tabularNumbers}
`

const HeaderCell = styled.th`
  position: sticky;
  top: 0;
  z-index: 1;
  background: ${getColor("mainChartBg")};
  padding: 3px 0 3px 12px;
  font-weight: 400;
  text-align: right;
  white-space: nowrap;
  color: ${({ $active }) => getColor($active ? "text" : "textLite")};
  cursor: ${({ $sortable }) => ($sortable ? "pointer" : "default")};

  &:first-child {
    padding-left: 0;
    text-align: left;
  }
`

const Row = styled.tr.attrs({ "data-testid": "modernLegend-row" })`
  border-top: 1px solid ${getColor("borderSecondary")};
  cursor: pointer;
  opacity: ${({ $off }) => ($off ? 0.4 : 1)};
`

const NameCell = styled.td`
  padding: 3px 0;
  color: ${getColor("text")};
  max-width: 180px;
`

const NameContent = styled.span`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`

const NameText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Cell = styled.td`
  padding: 3px 0 3px 12px;
  text-align: right;
  white-space: nowrap;
  color: ${({ $strong }) => getColor($strong ? "text" : "textLite")};
  font-weight: ${({ $strong }) => ($strong ? 600 : 400)};
`

const Unit = styled.span`
  color: ${getColor("textDescription")};
  font-size: 11px;
  margin-left: 4px;
  font-weight: 400;
`

const sortPairs = {
  name: ["nameAsc", "nameDesc"],
  value: ["valueDesc", "valueAsc"],
  anomaly: ["anomalyDesc", "anomalyAsc"],
}

export const nextSort = (column, current) => {
  const [first, second] = sortPairs[column]
  return current === first ? second : first
}

const arrows = {
  nameAsc: " ↑",
  nameDesc: " ↓",
  valueAsc: " ↑",
  valueDesc: " ↓",
  anomalyAsc: " ↑",
  anomalyDesc: " ↓",
}

const SortHeader = ({ column, sort, onSort, children, ...rest }) => {
  const active = sortPairs[column].includes(sort)

  return (
    <HeaderCell
      $sortable
      $active={active}
      onClick={() => onSort(nextSort(column, sort))}
      data-testid={`modernLegend-sort-${column}`}
      {...rest}
    >
      {active ? `${children}${arrows[sort]}` : children}
    </HeaderCell>
  )
}

const useScrollFade = deps => {
  const ref = useRef(null)
  const [fade, setFade] = useState(false)

  const update = () => {
    const el = ref.current
    if (!el) return
    setFade(el.scrollHeight - el.scrollTop - el.clientHeight > 1)
  }

  useLayoutEffect(update, deps)

  return [ref, fade, update]
}

const LegendTable = () => {
  const chart = useChart()
  const sort = useAttributeValue("dimensionsSort")
  const isHeatmap = useIsHeatmap()
  const { rows, hovering, timestamp } = useLegendRows({ withStats: true })
  useClearFocusOnUnmount()
  const time = useFormatTime(timestamp)
  const [scrollRef, fade, onScroll] = useScrollFade([rows.length])

  const units = new Set(rows.map(row => row.unit))
  const sharedUnit = units.size === 1 ? rows[0]?.unit : ""
  const onSort = value => chart.updateAttribute("dimensionsSort", value)

  return (
    <Wrapper data-track={chart.track("legend")}>
      <ScrollArea>
        <Scroller ref={scrollRef} onScroll={onScroll}>
          <Table>
            <thead>
              <tr>
                {hovering ? (
                  <HeaderCell data-testid="modernLegend-time">{time}</HeaderCell>
                ) : (
                  <SortHeader column="name" sort={sort} onSort={onSort}>
                    Name
                  </SortHeader>
                )}
                <SortHeader column="value" sort={sort} onSort={onSort}>
                  {hovering ? "At cursor" : "Last"}
                </SortHeader>
                <HeaderCell>Mean</HeaderCell>
                <HeaderCell>Max</HeaderCell>
                <SortHeader column="anomaly" sort={sort} onSort={onSort} title="Anomaly rate">
                  AR
                </SortHeader>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <Row
                  key={row.id}
                  $off={!row.visible}
                  onClick={onToggle(chart, row.id)}
                  onMouseEnter={() => row.visible && focusDimension(chart, row.id)}
                  onMouseLeave={() => focusDimension(chart, null)}
                  data-track={chart.track(`dimension-${row.name}`)}
                  data-dimension={row.id}
                >
                  <NameCell title={row.name}>
                    <NameContent>
                      {!isHeatmap && <Swatch $color={row.color} />}
                      <NameText>{row.name}</NameText>
                      {row.visible && <Flags flags={row.flags} />}
                      {row.visible && row.arp > 0 && <AnomalyBar $rate={row.arp} />}
                    </NameContent>
                  </NameCell>
                  <Cell $strong>
                    <Numeral>{row.visible ? row.display : "-"}</Numeral>
                    {row.visible && !!row.unit && !sharedUnit && <Unit>{row.unit}</Unit>}
                  </Cell>
                  <Cell>
                    <Numeral>{row.mean}</Numeral>
                  </Cell>
                  <Cell>
                    <Numeral>{row.max}</Numeral>
                  </Cell>
                  <Cell>
                    <Numeral>{row.visible ? row.anomaly || "-" : "-"}</Numeral>
                  </Cell>
                </Row>
              ))}
            </tbody>
          </Table>
        </Scroller>
        {fade && <Fade />}
      </ScrollArea>
      {!!sharedUnit && (
        <Unit as="div" data-testid="modernLegend-unit">{`Values in ${sharedUnit}`}</Unit>
      )}
    </Wrapper>
  )
}

export default LegendTable
