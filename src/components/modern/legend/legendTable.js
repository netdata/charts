import { useLayoutEffect, useRef, useState } from "react"
import styled from "styled-components"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Box, Flex, getColor } from "@netdata/netdata-ui"
import {
  useAttributeValue,
  useChart,
  useFormatTime,
  useInitialLoading,
} from "@/components/provider"
import { Bone } from "@/components/skeleton"
import { useIsHeatmap } from "@/helpers/heatmap"
import notSelectable from "@/components/helpers/notSelectable"
import { tabularNumbers } from "@/components/modern/tokens"
import { AnomalyBar, Flags, Unit as BaseUnit, onToggle } from "./parts"
import { Numeral } from "@/components/modern/numerals"
import { LineSwatch } from "@/components/modern/swatch"
import { LegendRowAction } from "@/components/modern/rowAction"
import { focusDimension, useClearFocusOnUnmount } from "./mode"
import { useLegendRows } from "./useLegendRows"

export const tableRowHeight = 23
export const tableOverscan = 8
export const minNameWidth = 100

export const showStatColumns = ({ shown, nameWidth, statsWidth }) => {
  if (!nameWidth) return shown
  return shown ? nameWidth >= minNameWidth : nameWidth - statsWidth >= minNameWidth
}

const Wrapper = styled(Flex).attrs({
  "data-testid": "modernLegend-table",
  column: true,
  position: "relative",
  flex: false,
  basis: "40%",
  width: { min: 60, max: "50%" },
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
  background: linear-gradient(transparent, ${getColor("cardBackground")});
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
  background: "cardBackground",
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
  ${notSelectable}
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

const SkeletonRow = styled(Box).attrs({
  as: "tr",
  border: { side: "top", color: "borderSecondary" },
})`
  height: ${tableRowHeight}px;
`

const skeletonNames = ["64%", "48%", "56%", "40%", "52%"]

const LegendRowsSkeleton = ({ columns }) => (
  <tbody data-testid="legendTableSkeleton">
    {skeletonNames.map(width => (
      <SkeletonRow key={width}>
        <NameCell>
          <Flex alignItems="center" gap={2}>
            <Bone width={2} height={2} round={true} />
            <Bone width={width} height={2} />
          </Flex>
        </NameCell>
        {Array.from({ length: columns }, (_, column) => (
          <Cell key={column}>
            <Flex justifyContent="end">
              <Bone width={8} height={2} />
            </Flex>
          </Cell>
        ))}
      </SkeletonRow>
    ))}
  </tbody>
)

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

const useStatColumns = () => {
  const headRef = useRef(null)
  const statsWidthRef = useRef(0)
  const [shown, setShown] = useState(true)

  useLayoutEffect(() => {
    const row = headRef.current
    if (!row) return

    const measure = () => {
      const [nameCell] = row.cells
      const statCells = row.querySelectorAll("[data-stat-column]")
      if (statCells.length)
        statsWidthRef.current = Array.from(statCells).reduce(
          (sum, cell) => sum + cell.getBoundingClientRect().width,
          0
        )
      setShown(current =>
        showStatColumns({
          shown: current,
          nameWidth: nameCell.getBoundingClientRect().width,
          statsWidth: statsWidthRef.current,
        })
      )
    }
    measure()

    if (typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver(measure)
    observer.observe(row.cells[0])
    return () => observer.disconnect()
  }, [])

  return [headRef, shown]
}

const LegendTable = () => {
  const chart = useChart()
  const sort = useAttributeValue("dimensionsSort")
  const isHeatmap = useIsHeatmap()
  const initialLoading = useInitialLoading()
  const { ids, getRow, hovering, pinned, timestamp } = useLegendRows({
    withStats: true,
    withRows: false,
  })
  useClearFocusOnUnmount()
  const time = useFormatTime(timestamp)
  const readout = hovering || pinned
  const [scrollRef, fade, onScroll] = useScrollFade([ids.length])
  const [headRef, showStats] = useStatColumns()
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
              <tr ref={headRef}>
                <SortHeader
                  column="name"
                  sort={sort}
                  onSort={onSort}
                  disabled={readout}
                  {...(readout && { "data-testid": "modernLegend-time" })}
                >
                  {readout ? time : "Name"}
                </SortHeader>
                <SortHeader column="value" sort={sort} onSort={onSort}>
                  {hovering ? "At cursor" : pinned ? "Pinned" : "Last"}
                </SortHeader>
                {showStats && <HeaderCell data-stat-column>Mean</HeaderCell>}
                {showStats && <HeaderCell data-stat-column>Max</HeaderCell>}
                <SortHeader column="anomaly" sort={sort} onSort={onSort} title="Anomaly rate">
                  Anomaly
                </SortHeader>
              </tr>
            </thead>
            {initialLoading ? (
              <LegendRowsSkeleton columns={showStats ? 4 : 2} />
            ) : (
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
                          <LegendRowAction row={row} />
                          {row.visible && <Flags flags={row.flags} />}
                          {row.visible && row.arp > 0 && <AnomalyBar rate={row.arp} />}
                        </Flex>
                      </NameCell>
                      <Cell isStrong>
                        <Numeral>{row.visible ? row.display : "-"}</Numeral>
                        {row.visible && !!row.unit && <Unit>{row.unit}</Unit>}
                      </Cell>
                      {showStats && (
                        <Cell>
                          <Numeral>{row.mean}</Numeral>
                          {row.mean !== "-" && !!row.meanUnit && <Unit>{row.meanUnit}</Unit>}
                        </Cell>
                      )}
                      {showStats && (
                        <Cell>
                          <Numeral>{row.max}</Numeral>
                          {row.max !== "-" && !!row.maxUnit && <Unit>{row.maxUnit}</Unit>}
                        </Cell>
                      )}
                      <Cell>
                        <Numeral>{row.visible ? row.anomaly || "-" : "-"}</Numeral>
                      </Cell>
                    </Row>
                  ))}
                <Spacer height={after} />
              </tbody>
            )}
          </Table>
        </Scroller>
        {fade && <Fade />}
      </Flex>
    </Wrapper>
  )
}

export default LegendTable
