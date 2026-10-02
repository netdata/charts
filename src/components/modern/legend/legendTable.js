import React, { useLayoutEffect, useRef, useState } from "react"
import styled from "styled-components"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Box, Flex, getColor } from "@netdata/netdata-ui"
import { useAttributeValue, useChart, useFormatTime } from "@/components/provider"
import { useIsHeatmap } from "@/helpers/heatmap"
import { tabularNumbers } from "@/components/modern/tokens"
import { AnomalyBar, Flags, Unit as BaseUnit, onToggle } from "./parts"
import { Numeral } from "@/components/modern/numerals"
import { LineSwatch } from "@/components/modern/swatch"
import { focusDimension, useClearFocusOnUnmount } from "./mode"
import { useLegendRows } from "./useLegendRows"

export const tableRowHeight = 23
export const tableOverscan = 8

const Wrapper = styled(Flex).attrs({
  "data-testid": "modernLegend-table",
  column: true,
  position: "relative",
  flex: false,
  basis: "40%",
  width: { min: 60, max: 105 },
  height: { min: "0px" },
  overflow: "hidden",
  color: "inherit",
})`
  overflow-anchor: none;
`

const Scroller = styled(Box).attrs({
  "data-testid": "modernLegend-scroller",
  width: { min: "0px" },
  height: { min: "0px" },
  overflow: { vertical: "auto", horizontal: "hidden" },
})`
  flex: 1;
`

const Fade = styled(Box).attrs({
  "data-testid": "modernLegend-fade",
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  height: 9,
})`
  pointer-events: none;
  background: linear-gradient(transparent, ${getColor("mainChartBg")});
`

const Table = styled(Box).attrs({ as: "table", width: "100%" })`
  border-collapse: collapse;
  font-size: 12px;
  ${tabularNumbers}
`

const HeaderCell = styled(Box).attrs(({ isSortable }) => ({
  as: "th",
  position: "sticky",
  top: 0,
  zIndex: 1,
  background: "mainChartBg",
  cursor: isSortable ? "pointer" : "default",
}))`
  padding: 3px 0 3px 12px;
  font-weight: 400;
  text-align: right;
  white-space: nowrap;
  color: ${({ isActive }) => getColor(isActive ? "text" : "textLite")};

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

const Row = styled(Box).attrs(({ isOff }) => ({
  as: "tr",
  "data-testid": "modernLegend-row",
  border: { side: "top", color: "borderSecondary" },
  cursor: "pointer",
  opacity: isOff ? 0.4 : 1,
}))`
  height: ${tableRowHeight}px;
`

const NameCell = styled(Box).attrs({ as: "td", width: "100%" })`
  padding: 3px 0;
  color: ${getColor("text")};
  max-width: 0;
`

const NameText = styled(Box).attrs({ as: "span", overflow: "hidden" })`
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Cell = styled(Box).attrs({ as: "td" })`
  padding: 3px 0 3px 12px;
  text-align: right;
  white-space: nowrap;
  color: ${({ isStrong }) => getColor(isStrong ? "text" : "textLite")};
  font-weight: ${({ isStrong }) => (isStrong ? 600 : 400)};

  &:last-child {
    padding-right: 4px;
  }
`

const Spacer = ({ height }) =>
  height > 0 ? (
    <tr aria-hidden="true" data-testid="modernLegend-spacer" style={{ height: `${height}px` }} />
  ) : null

const Unit = styled(BaseUnit).attrs({ margin: [0, 0, 0, 1] })`
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
      isSortable={!disabled}
      isActive={active}
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
      <Flex position="relative" flex="1" height={{ min: "0px" }} color="inherit">
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
                    isOff={!row.visible}
                    onClick={onToggle(chart, row.id)}
                    onMouseEnter={() => row.visible && focusDimension(chart, row.id)}
                    onMouseLeave={() => focusDimension(chart, null)}
                    data-track={chart.track(`dimension-${row.name}`)}
                    data-dimension={row.id}
                  >
                    <NameCell title={row.name}>
                      <Flex
                        as="span"
                        position="relative"
                        alignItems="center"
                        gap={2}
                        width={{ min: "0px" }}
                        color="inherit"
                      >
                        {!isHeatmap && <LineSwatch swatchColor={row.color} />}
                        <NameText>{row.name}</NameText>
                        {row.visible && <Flags flags={row.flags} />}
                        {row.visible && row.arp > 0 && <AnomalyBar rate={row.arp} />}
                      </Flex>
                    </NameCell>
                    <Cell isStrong>
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
      </Flex>
    </Wrapper>
  )
}

export default LegendTable
