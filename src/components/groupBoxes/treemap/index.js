import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import styled from "styled-components"
import { Box, Drop, Flex } from "@netdata/netdata-ui"
import { useChart, useAttribute, useAttributeValue } from "@/components/provider"
import { makeModernColor, getThreshold } from "@/components/modern/groupBoxes/scale"
import { Panel, dropProps } from "@/components/modern/menu"
import useGroupBox from "@/components/groupBoxes/useGroupBox"
import useGroupBoxRowData from "@/components/groupBoxes/useGroupBoxRowData"
import { buildBoxTree, getBoxIds, findGroup } from "./tree"
import { layoutTreemap, hitTest, fitHeight } from "./layout"
import {
  sizeCanvas,
  makePalette,
  drawTreemap,
  shouldAnimate,
  shouldAnimateZoom,
  getHotGroups,
  animateLayout,
} from "./draw"
import { getRank } from "./details"
import BoxCard from "./card"
import Breadcrumb from "./breadcrumb"

const hoverDelay = 100

const Anchor = styled(Box).attrs({ position: "absolute" })`
  pointer-events: none;
`

const useSize = (ref, fixed) => {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    if (fixed || !ref.current) return
    const measure = () =>
      setSize({ width: ref.current?.clientWidth || 0, height: ref.current?.clientHeight || 0 })
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [fixed])

  return fixed || size
}

const crumbsFor = (root, focusPath) => [
  { path: [], name: "All", count: root.count },
  ...focusPath.map((_, index) => {
    const path = focusPath.slice(0, index + 1)
    const group = findGroup(root, path)
    return { path, name: group.name, count: group.count }
  }),
]

const Treemap = ({ uiName, width, height, fit = false }) => {
  const chart = useChart()
  const payload = useGroupBox(uiName)
  const rowData = useGroupBoxRowData(uiName)
  const grouped = useAttributeValue("viewDimensions")?.grouped
  const nodes = useAttributeValue("nodes")
  const theme = useAttributeValue("theme")
  const min = useAttributeValue("min")
  const max = useAttributeValue("max")
  const thresholdValue = useAttributeValue("groupBoxesThreshold")
  const [focusPath, setFocus] = useAttribute("groupBoxesFocus")
  const [pinnedId, setPinned] = useAttribute("groupBoxesPinned")
  const [hover, setHover] = useState(null)

  const areaRef = useRef()
  const canvasRef = useRef()
  const layoutRef = useRef(null)
  const cancelRef = useRef(() => {})
  const hoverTimer = useRef()
  const [anchor, setAnchor] = useState(null)

  const fixed = width !== undefined && height !== undefined ? { width, height } : null
  const size = useSize(areaRef, fixed)

  const root = useMemo(
    () => buildBoxTree(payload.labels.length ? getBoxIds(payload) : [], grouped, nodes),
    [payload, grouped, nodes]
  )
  const focus = findGroup(root, focusPath || []) ? focusPath : []
  const layout = useMemo(
    () => layoutTreemap(root, focus, size),
    [root, focus.join(","), size.width, size.height]
  )

  const valueOf = id => chart.getRowDimensionValue(id, rowData)
  const color = makeModernColor(chart)(min, max)
  const colorOf = id => color(valueOf(id))
  const hotGroups = getHotGroups(layout.leaves, valueOf, getThreshold(chart))
  const hotGroup = groupId => hotGroups.has(groupId)

  const draw = current => {
    if (!canvasRef.current || !(size.width > 0) || !(size.height > 0)) return
    const ctx = sizeCanvas(canvasRef.current, size.width, size.height)
    drawTreemap(ctx, current, {
      ...size,
      palette: makePalette(chart),
      colorOf,
      hotGroup,
      activeId: pinnedId || hover?.id,
    })
  }

  useLayoutEffect(() => {
    cancelRef.current()
    const previous = layoutRef.current
    layoutRef.current = layout
    if (shouldAnimateZoom(previous, layout) && shouldAnimate(layout.leaves.length)) {
      cancelRef.current = animateLayout({ from: previous, to: layout, onFrame: draw })
      return () => cancelRef.current()
    }
    draw(layout)
  }, [layout, rowData, theme, thresholdValue, hover?.id, pinnedId])

  useEffect(() => () => clearTimeout(hoverTimer.current), [])

  useEffect(() => {
    if (!pinnedId || !root.count) return
    if (!getBoxIds(payload).includes(pinnedId)) setPinned(null)
  }, [root, pinnedId])

  const findLeaf = id => layout.leaves.find(leaf => leaf.id === id)
  const pinned = pinnedId ? findLeaf(pinnedId) : null
  const shown = pinned || (hover ? findLeaf(hover.id) : null)

  const onMove = event => {
    const hit = hitTest(layout, event.offsetX, event.offsetY)
    const id = hit?.type === "leaf" ? hit.item.id : null
    if (id === hover?.id) return
    clearTimeout(hoverTimer.current)
    if (!id) return setHover(null)
    hoverTimer.current = setTimeout(() => setHover({ id }), hoverDelay)
  }

  const onLeave = () => {
    clearTimeout(hoverTimer.current)
    setHover(null)
  }

  const onClick = event => {
    const hit = hitTest(layout, event.offsetX, event.offsetY)
    if (!hit) return
    if (hit.type === "header") {
      setPinned(null)
      setFocus(hit.item.path)
      return
    }
    setHover(null)
    setPinned(hit.item.id)
  }

  const zoomTo = path => {
    setPinned(null)
    setFocus(path)
  }

  const cardFor = leaf => {
    const parent = leaf.parentId ? findGroup(root, leaf.path.slice(0, -1)) : root
    const siblings = (parent || root).children.filter(child => child.leaf).map(child => child.id)
    const { rank, of } = getRank(siblings, leaf.id, valueOf)
    return (
      <BoxCard
        id={leaf.id}
        name={leaf.name}
        path={leaf.path.slice(0, -1)}
        groupName={parent && parent !== root ? parent.name : "all"}
        rank={rank}
        of={of}
        rowData={rowData}
        pinned={!!pinned}
        focus={focus}
        onZoom={zoomTo}
        onClose={() => setPinned(null)}
      />
    )
  }

  return (
    <Flex column gap={2} width="100%" height="100%" data-testid="groupBoxesTreemap">
      <Breadcrumb crumbs={crumbsFor(root, focus)} onSelect={zoomTo} />
      <Flex
        ref={areaRef}
        flex={!fit}
        height={
          fit
            ? `${fitHeight({
                boxes: root.count,
                groups: root.children.filter(child => !child.leaf).length,
                width: size.width,
              })}px`
            : undefined
        }
        position="relative"
        overflow="hidden"
        data-testid="groupBoxesTreemap-area"
      >
        <canvas
          ref={canvasRef}
          data-testid="groupBoxesTreemap-canvas"
          onMouseMove={event => onMove(event.nativeEvent)}
          onMouseOut={onLeave}
          onClick={event => onClick(event.nativeEvent)}
        />
        {shown && (
          <Anchor
            key={shown.id}
            ref={setAnchor}
            data-testid="groupBoxesTreemap-anchor"
            style={{
              left: shown.x0,
              top: shown.y0,
              width: shown.x1 - shown.x0,
              height: shown.y1 - shown.y0,
            }}
          />
        )}
      </Flex>
      {shown && anchor && (
        <Drop
          {...dropProps}
          target={anchor}
          align={{ top: "bottom", left: "left" }}
          stretch={false}
          noEvents={!pinned}
          onEsc={pinned ? () => setPinned(null) : undefined}
          onClickOutside={pinned ? () => setPinned(null) : undefined}
          data-toolbox={chart.getId()}
        >
          <Panel width={75} padding={[0]}>
            {cardFor(shown)}
          </Panel>
        </Drop>
      )}
    </Flex>
  )
}

export default Treemap
