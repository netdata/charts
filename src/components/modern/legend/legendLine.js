import React, { useLayoutEffect, useRef, useState } from "react"
import styled from "styled-components"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Box, Drop, Flex, getColor } from "@netdata/netdata-ui"
import { useChart } from "@/components/provider"
import { useIsHeatmap } from "@/helpers/heatmap"
import { AnomalyBar, Flags, Unit, Value, onToggle } from "./parts"
import { LineSwatch } from "@/components/modern/swatch"
import { Panel, dropProps } from "@/components/modern/menu"
import { focusDimension, useClearFocusOnUnmount } from "./mode"
import { useLegendRows } from "./useLegendRows"

export const lineEntryCap = 24
export const moreRowHeight = 24
const moreOverscan = 8

const Entry = styled(Flex).attrs(({ isOff }) => ({
  as: "button",
  type: "button",
  "data-testid": "modernLegend-entry",
  position: "relative",
  alignItems: "center",
  gap: 1.5,
  padding: [0],
  cursor: "pointer",
  opacity: isOff ? 0.4 : 1,
}))`
  display: inline-flex;
  border: 0;
  background: transparent;
  font-size: 12px;
  line-height: 18px;
`

const Name = styled(Box).attrs({ as: "span", width: { max: 45 }, overflow: "hidden" })`
  color: ${getColor("textLite")};
  white-space: nowrap;
  text-overflow: ellipsis;
`

const More = styled(Box).attrs({
  as: "button",
  type: "button",
  "data-testid": "modernLegend-more",
  padding: [0],
  cursor: "pointer",
})`
  border: 0;
  background: transparent;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  color: ${getColor("textLite")};

  &:hover {
    color: ${getColor("text")};
  }
`

const LegendEntry = ({ chart, row, isHeatmap, ...rest }) => (
  <Entry
    isOff={!row.visible}
    onClick={onToggle(chart, row.id)}
    onMouseEnter={() => row.visible && focusDimension(chart, row.id)}
    onMouseLeave={() => focusDimension(chart, null)}
    data-track={chart.track(`dimension-${row.name}`)}
    data-dimension={row.id}
    title={row.name}
    {...rest}
  >
    {!isHeatmap && <LineSwatch swatchColor={row.color} />}
    <Name>{row.name}</Name>
    {row.visible && <Value>{row.display}</Value>}
    {row.visible && !!row.unit && <Unit>{row.unit}</Unit>}
    {row.visible && <Flags flags={row.flags} />}
    {row.visible && row.arp > 0 && <AnomalyBar rate={row.arp} />}
  </Entry>
)

const MoreDimensions = ({ chart, target, ids, getRow, isHeatmap, onClose }) => {
  const scrollRef = useRef(null)
  const virtualizer = useVirtualizer({
    count: ids.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => moreRowHeight,
    overscan: moreOverscan,
  })
  const items = virtualizer.getVirtualItems()
  const before = items.length ? items[0].start : 0
  const after = items.length ? virtualizer.getTotalSize() - items[items.length - 1].end : 0

  return (
    <Drop
      target={target}
      onEsc={onClose}
      onClickOutside={onClose}
      data-toolbox={chart.getId()}
      {...dropProps}
    >
      <Panel
        ref={scrollRef}
        width="280px"
        height={{ max: "320px" }}
        overflow={{ vertical: "auto" }}
        data-testid="modernLegend-moreList"
      >
        <Box flex={false} style={{ height: before }} data-testid="modernLegend-moreSpacer" />
        {items
          .map(item => getRow(ids[item.index]))
          .map(row => (
            <Flex key={row.id} height={`${moreRowHeight}px`} alignItems="center" flex={false}>
              <LegendEntry chart={chart} row={row} isHeatmap={isHeatmap} />
            </Flex>
          ))}
        <Box flex={false} style={{ height: after }} data-testid="modernLegend-moreSpacer" />
      </Panel>
    </Drop>
  )
}

const overflows = (container, node) =>
  !!node && node.offsetTop + node.offsetHeight > container.clientHeight + 1

const useFit = (ref, count) => {
  const [limit, setLimit] = useState(lineEntryCap)
  const [width, setWidth] = useState(0)
  const staleLayout = useRef(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver(() => setWidth(Math.round(el.clientWidth)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    if (limit === lineEntryCap) return
    staleLayout.current = true
    setLimit(lineEntryCap)
  }, [count, width])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (staleLayout.current) {
      staleLayout.current = false
      return
    }

    const entries = el.querySelectorAll("[data-testid='modernLegend-entry']")
    const more = el.querySelector("[data-testid='modernLegend-more']")
    if (limit <= 1 || !(overflows(el, entries[entries.length - 1]) || overflows(el, more))) return

    let fitting = 0
    while (fitting < entries.length && !overflows(el, entries[fitting])) fitting += 1
    const room = count > fitting ? fitting - 1 : fitting
    setLimit(Math.max(1, Math.min(limit - 1, room)))
  })

  return limit
}

const LegendLine = () => {
  const chart = useChart()
  const ref = useRef(null)
  const { ids, getRow } = useLegendRows({ withRows: false })
  useClearFocusOnUnmount()
  const isHeatmap = useIsHeatmap()
  const limit = useFit(ref, ids.length)
  const rows = ids.slice(0, limit).map(getRow)
  const hidden = ids.length - rows.length
  const moreRef = useRef(null)
  const [moreOpen, setMoreOpen] = useState(false)

  const onMore = () => setMoreOpen(open => !open)

  return (
    <Flex
      ref={ref}
      position="relative"
      flexWrap
      alignItems="center"
      gap={4}
      gapY={1}
      width={{ min: "0px" }}
      height={{ max: 16 }}
      overflow="hidden"
      color="inherit"
      data-testid="modernLegend-line"
      data-track={chart.track("legend")}
    >
      {rows.map(row => (
        <LegendEntry key={row.id} chart={chart} row={row} isHeatmap={isHeatmap} />
      ))}
      {hidden > 0 && (
        <More
          ref={moreRef}
          onClick={onMore}
          title="Show every dimension"
          aria-expanded={moreOpen}
          data-track={chart.track("legend-more")}
        >
          {`+${hidden} more`}
        </More>
      )}
      {hidden > 0 && moreOpen && moreRef.current && (
        <MoreDimensions
          chart={chart}
          target={moreRef.current}
          ids={ids.slice(limit)}
          getRow={getRow}
          isHeatmap={isHeatmap}
          onClose={() => setMoreOpen(false)}
        />
      )}
    </Flex>
  )
}

export default LegendLine
