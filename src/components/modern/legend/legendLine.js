import React, { useLayoutEffect, useRef, useState } from "react"
import styled from "styled-components"
import { getColor } from "@netdata/netdata-ui"
import { useChart } from "@/components/provider"
import { useIsHeatmap } from "@/helpers/heatmap"
import { AnomalyBar, Flags, Numeral, Swatch, onToggle } from "./parts"
import { focusDimension, useClearFocusOnUnmount } from "./mode"
import { useLegendRows } from "./useLegendRows"

export const lineEntryCap = 24

const Line = styled.div.attrs({ "data-testid": "modernLegend-line" })`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
  min-width: 0;
  max-height: 64px;
  overflow: hidden;
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

const More = styled.button.attrs({ type: "button", "data-testid": "modernLegend-more" })`
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  color: ${getColor("textLite")};

  &:hover {
    color: ${getColor("text")};
  }
`

export const openAllDimensions = chart => {
  if (chart.getAttribute("expandable")) {
    chart.updateAttributes({ "drawer.action": "values", expanded: true })
    return
  }

  chart.updateAttribute("legendLayout", "table")
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

  return (
    <Line ref={ref} data-track={chart.track("legend")}>
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
      {hidden > 0 && (
        <More
          onClick={() => openAllDimensions(chart)}
          title="Show every dimension"
          data-track={chart.track("legend-more")}
        >
          {`+${hidden} more`}
        </More>
      )}
    </Line>
  )
}

export default LegendLine
