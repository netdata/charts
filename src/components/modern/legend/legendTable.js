import React, { useLayoutEffect, useRef, useState } from "react"
import styled from "styled-components"
import { useVirtualizer } from "@tanstack/react-virtual"
import { getColor } from "@netdata/netdata-ui"
import { useAttributeValue, useChart, useFormatTime } from "@/components/provider"
import { useIsHeatmap } from "@/helpers/heatmap"
import { tabularNumbers } from "@/components/modern/tokens"
import { AnomalyBar, Flags, Numeral, Swatch, onToggle } from "./parts"
import { focusDimension, useClearFocusOnUnmount } from "./mode"
import { useLegendRows } from "./useLegendRows"

export const tableRowHeight = 23
export const tableOverscan = 8

const Wrapper = styled.div.attrs({ "data-testid": "modernLegend-table" })`
  position: relative;
  flex: 0 0 40%;
  min-width: 240px;
  max-width: 420px;
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-anchor: none;
`

const ScrollArea = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
`

const Scroller = styled.div.attrs({ "data-testid": "modernLegend-scroller" })`
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
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
    width: 100%;
    max-width: 0;
  }

  &:last-child {
    padding-right: 4px;
  }
`

const Row = styled.tr.attrs({ "data-testid": "modernLegend-row" })`
  box-sizing: border-box;
  height: ${tableRowHeight}px;
  border-top: 1px solid ${getColor("borderSecondary")};
  cursor: pointer;
  opacity: ${({ $off }) => ($off ? 0.4 : 1)};
`

const NameCell = styled.td`
  padding: 3px 0;
  color: ${getColor("text")};
  width: 100%;
  max-width: 0;
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

  &:last-child {
    padding-right: 4px;
  }
`

const Spacer = ({ height }) =>
  height > 0 ? (
    <tr aria-hidden="true" data-testid="modernLegend-spacer" style={{ height: `${height}px` }} />
  ) : null

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

const SortHeader = ({ column, sort, onSort, children, disabled = false, ...rest }) => {
  const active = !disabled && sortPairs[column].includes(sort)

  return (
    <HeaderCell
      $sortable={!disabled}
      $active={active}
      onClick={disabled ? undefined : () => onSort(nextSort(column, sort))}
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
  const { ids, getRow, hovering, timestamp } = useLegendRows({ withStats: true, withRows: false })
  useClearFocusOnUnmount()
  const time = useFormatTime(timestamp)
  const [scrollRef, fade, onScroll] = useScrollFade([ids.length])
  const onSort = value => chart.updateAttribute("dimensionsSort", value)

  const virtualizer = useVirtualizer({
    count: ids.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => tableRowHeight,
    overscan: tableOverscan,
  })
  const items = virtualizer.getVirtualItems()
  const before = items.length ? items[0].start : 0
  const after = items.length ? virtualizer.getTotalSize() - items[items.length - 1].end : 0

  return (
    <Wrapper data-track={chart.track("legend")}>
      <ScrollArea>
        <Scroller ref={scrollRef} onScroll={onScroll}>
          <Table>
            <thead>
              <tr>
                <SortHeader
                  column="name"
                  sort={sort}
                  onSort={onSort}
                  disabled={hovering}
                  {...(hovering && { "data-testid": "modernLegend-time" })}
                >
                  {hovering ? time : "Name"}
                </SortHeader>
                <SortHeader column="value" sort={sort} onSort={onSort}>
                  {hovering ? "At cursor" : "Last"}
                </SortHeader>
                <HeaderCell>Mean</HeaderCell>
                <HeaderCell>Max</HeaderCell>
                <SortHeader column="anomaly" sort={sort} onSort={onSort} title="Anomaly rate">
                  Anomaly
                </SortHeader>
              </tr>
            </thead>
            <tbody>
              <Spacer height={before} />
              {items
                .map(item => getRow(ids[item.index]))
                .map(row => (
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
                      {row.visible && !!row.unit && <Unit>{row.unit}</Unit>}
                    </Cell>
                    <Cell>
                      <Numeral>{row.mean}</Numeral>
                      {row.mean !== "-" && !!row.meanUnit && <Unit>{row.meanUnit}</Unit>}
                    </Cell>
                    <Cell>
                      <Numeral>{row.max}</Numeral>
                      {row.max !== "-" && !!row.maxUnit && <Unit>{row.maxUnit}</Unit>}
                    </Cell>
                    <Cell>
                      <Numeral>{row.visible ? row.anomaly || "-" : "-"}</Numeral>
                    </Cell>
                  </Row>
                ))}
              <Spacer height={after} />
            </tbody>
          </Table>
        </Scroller>
        {fade && <Fade />}
      </ScrollArea>
    </Wrapper>
  )
}

export default LegendTable
