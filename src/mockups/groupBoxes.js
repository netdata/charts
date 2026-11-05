import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import {
  easeCubicInOut,
  groups,
  hierarchy,
  pointer,
  scaleSymlog,
  select,
  treemap,
  treemapSquarify,
} from "d3"
import { format } from "./primitives"
import { themes, font } from "./chartCard"

const numerals = "'IBM Plex Sans Condensed', 'IBM Plex Sans', system-ui, sans-serif"

const scales = {
  light: ["#EAF1FC", "#C9DCF7", "#9CC0F0", "#6A9EE6", "#3D7AD6", "#2358B0", "#173E80"],
  dark: ["#172230", "#1B3350", "#224B78", "#2C66A3", "#3F84D4", "#6FA6EE", "#A9CBF8"],
}
const hot = "#F95251"
const threshold = 90

const random = seed => {
  let state = seed
  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

const namespaces = [
  [
    "mon",
    101,
    ["prometheus-k8s", "alertmanager", "grafana", "kube-state-metrics", "node-exporter"],
  ],
  ["infra", 61, ["vault", "consul", "external-dns", "cluster-autoscaler"]],
  ["apps", 51, ["checkout", "cart", "search", "payments", "catalog"]],
  ["netdata", 48, ["netdata-child", "netdata-otel-collector-agent", "netdata-parent"]],
  ["kube-system", 45, ["coredns", "aws-node", "kube-proxy", "ebs-csi-node"]],
  ["logging", 36, ["fluent-bit", "loki", "vector"]],
  ["istio-system", 34, ["istiod", "istio-ingressgateway"]],
  ["argocd", 22, ["argocd-server", "argocd-repo-server", "argocd-redis"]],
  ["ingress-nginx", 14, ["ingress-nginx-controller"]],
  ["amazon-guardduty", 12, ["aws-guardduty-agent"]],
  ["default", 9, ["debug-shell", "busybox"]],
  ["karpenter", 8, ["karpenter"]],
  ["cert-manager", 6, ["cert-manager", "cert-manager-webhook"]],
]

const nodes = Array.from(
  { length: 12 },
  (_, i) => `ip-10-200-${130 + i * 4}-${((i * 37) % 240) + 11}`
)
const containers = ["app", "istio-proxy", "config-reloader", "sd", "otel-collector", "init"]
const alphabet = "abcdefghjkmnpqrstvwxz23456789"

export const makeItems = () => {
  const rand = random(7)
  const suffix = () =>
    Array.from({ length: 5 }, () => alphabet[Math.floor(rand() * alphabet.length)]).join("")
  const items = []
  namespaces.forEach(([namespace, count, controllers]) => {
    for (let i = 0; i < count; i++) {
      const controller = controllers[Math.floor(rand() * controllers.length)]
      const r = rand()
      const value = r < 0.7 ? r * 6 : r < 0.93 ? 6 + (r - 0.7) * 120 : 35 + (r - 0.93) * 1290
      const aggregated = rand() < 0.05 ? 5 + Math.floor(rand() * 36) : 1
      const pods = Array.from({ length: aggregated }, () => `${controller}-${suffix()}`)
      const node = nodes[Math.floor(rand() * nodes.length)]
      const spark = Array.from({ length: 24 }, (_, k) =>
        k === 23 ? value : Math.max(0, value * (0.7 + rand() * 0.6))
      )
      items.push({
        id: `${namespace}/${pods[0]}`,
        leaf: true,
        name: pods[0],
        namespace,
        node,
        value,
        spark,
        labels: {
          k8s_namespace: [namespace],
          k8s_pod_name: pods,
          k8s_container_name: containers.slice(0, 1 + Math.floor(rand() * 3)),
          k8s_controller_name: [controller],
          k8s_node_name: [`${node}.ec2.internal`],
          k8s_kind: ["container"],
        },
      })
    }
  })
  return items
}

const levelKeys = {
  namespace: d => d.namespace,
  controller: d => d.labels.k8s_controller_name[0],
  node: d => d.node,
}

export const buildTree = (items, levels, name = "All", path = []) => ({
  id: path.join("/") || "root",
  name,
  path,
  count: items.length,
  max: Math.max(...items.map(item => item.value)),
  children: levels.length
    ? groups(items, levelKeys[levels[0]])
        .sort((a, b) => b[1].length - a[1].length)
        .map(([key, values]) => buildTree(values, levels.slice(1), key, [...path, key]))
    : [...items].sort((a, b) => b.value - a.value),
})

const flattenLeaves = node => (node.leaf ? [node] : node.children.flatMap(flattenLeaves))

const findNode = (tree, path) =>
  path.reduce((node, key) => node.children.find(child => child.name === key) || node, tree)

const useColor = (theme, max) => value =>
  value >= threshold
    ? hot
    : scales[theme][Math.min(6, Math.floor((Math.min(value, max) / (max || 1)) * 7))]

const useWidth = ref => {
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    if (!ref.current) return
    const measure = () => setWidth(ref.current?.clientWidth || 0)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return width
}

const ordinal = n => {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

const middle = (text, room) => {
  if (text.length <= room) return text
  if (room < 5) return ""
  const head = Math.ceil((room - 1) / 2)
  const tail = room - 1 - head
  return `${text.slice(0, head)}…${text.slice(text.length - tail)}`
}

const ellipsis = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }

const Spark = ({ values, color, stroke }) => {
  const max = Math.max(...values) || 1
  const x = i => (i / (values.length - 1)) * 76 + 2
  const y = v => 20 - (v / max) * 16
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("")
  return (
    <svg width="80" height="22" style={{ flex: "none" }}>
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.25" strokeLinejoin="round" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r="2.5" fill={color} />
    </svg>
  )
}

const LabelValue = ({ t, values }) => (
  <span
    style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 0 }}
    title={values.join(", ")}
  >
    <span style={{ ...ellipsis, color: t.ink }}>{values[0]}</span>
    {values.length > 1 && (
      <span
        style={{
          flex: "none",
          fontFamily: numerals,
          fontSize: 10.5,
          color: t.muted,
          background: t.chip,
          borderRadius: 4,
          padding: "0 5px",
        }}
      >
        +{values.length - 1}
      </span>
    )}
  </span>
)

export const Popover = ({ t, theme, item, group, max, hint, style }) => {
  const color = useColor(theme, max)(item.value)
  const siblings = flattenLeaves(group).sort((a, b) => b.value - a.value)
  const rank = siblings.findIndex(child => child.id === item.id) + 1
  return (
    <div
      data-testid="mockGroupBox-popover"
      style={{
        width: 300,
        background: t.hoverBg,
        boxShadow: t.hoverShadow,
        borderRadius: 8,
        padding: "10px 12px",
        fontFamily: font,
        fontSize: 11.5,
        color: t.ink,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        ...style,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ ...ellipsis, color: t.muted, fontSize: 11 }}>
          {[item.namespace, item.node].join("  ›  ")}
        </span>
        <span style={{ ...ellipsis, fontSize: 13, fontWeight: 600 }}>{item.name}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: numerals, fontSize: 24, fontWeight: 600, lineHeight: 1 }}>
          {format(item.value, 1)}
          <span style={{ fontSize: 13, color: t.muted, marginLeft: 2 }}>%</span>
        </span>
        <Spark values={item.spark} color={color} stroke={t.faint} />
        {rank > 0 && (
          <span
            style={{
              marginLeft: "auto",
              color: t.muted,
              fontSize: 11,
              textAlign: "right",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>{`${ordinal(rank)} of ${siblings.length}`}</span>
            <span>{`in ${group.name}`}</span>
          </span>
        )}
      </div>
      <div
        style={{
          position: "relative",
          height: 4,
          borderRadius: 2,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {scales[theme].map(step => (
          <span key={step} style={{ flex: 1, background: step, opacity: 0.55 }} />
        ))}
        <span
          style={{
            position: "absolute",
            top: -2,
            bottom: -2,
            width: 3,
            borderRadius: 2,
            left: `calc(${Math.min(100, (item.value / max) * 100)}% - 1.5px)`,
            background: item.value >= threshold ? hot : t.ink,
          }}
        />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto minmax(0, 1fr)",
          columnGap: 12,
          rowGap: 3,
          paddingTop: 8,
          borderTop: `1px solid ${t.border}`,
        }}
      >
        {Object.entries(item.labels).map(([key, values]) => (
          <React.Fragment key={key}>
            <span style={{ color: t.muted }}>{key}</span>
            <LabelValue t={t} values={values} />
          </React.Fragment>
        ))}
      </div>
      {hint && <span style={{ color: t.faint, fontSize: 11 }}>{hint}</span>}
    </div>
  )
}

const FloatingPopover = ({ hover, width, height, ...rest }) => {
  if (!hover) return null
  const left = hover.x + 16 + 300 > width ? hover.x - 316 : hover.x + 16
  const top = Math.max(4, Math.min(hover.y - 24, height - 250))
  return (
    <Popover
      {...rest}
      item={hover.item}
      group={hover.group}
      style={{ position: "absolute", left, top, zIndex: 3 }}
    />
  )
}

const Crumbs = ({ t, tree, focus, setFocus }) => (
  <div
    style={{
      display: "flex",
      gap: 6,
      alignItems: "center",
      fontSize: 12,
      color: t.muted,
      minHeight: 18,
    }}
  >
    {[[], ...focus.map((_, i) => focus.slice(0, i + 1))].map((path, i, all) => {
      const last = i === all.length - 1
      const node = findNode(tree, path)
      return (
        <React.Fragment key={path.join("/") || "root"}>
          {i > 0 && <span style={{ color: t.faint }}>›</span>}
          <button
            type="button"
            disabled={last}
            onClick={() => setFocus(path)}
            style={{
              all: "unset",
              cursor: last ? "default" : "pointer",
              color: last ? t.ink : t.muted,
              fontWeight: last ? 600 : 400,
              textDecoration: last ? "none" : "underline",
              textUnderlineOffset: 3,
              textDecorationColor: t.faint,
            }}
          >
            {i === 0 ? "All namespaces" : node.name}
            <span style={{ fontFamily: numerals, color: t.faint, marginLeft: 4 }}>
              {node.count}
            </span>
          </button>
        </React.Fragment>
      )
    })}
  </div>
)

const Cell = ({ item, color, active, onHover, onLeave }) => (
  <span
    onMouseEnter={onHover}
    onMouseMove={onHover}
    onMouseLeave={onLeave}
    style={{
      width: 14,
      height: 14,
      borderRadius: 3,
      background: color,
      outline: active ? "2px solid currentColor" : "none",
      outlineOffset: 1,
    }}
    data-value={item.value}
  />
)

const TileGroup = ({ t, node, color, onDrill, renderCell, nested }) => {
  const leaves = node.children[0]?.leaf
  const columns = Math.max(4, Math.ceil(Math.sqrt(node.children.length * 1.8)))
  return (
    <div
      style={{
        border: `1px solid ${t.border}`,
        borderRadius: 6,
        padding: "6px 8px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        background: nested ? "transparent" : t.panel,
      }}
    >
      <button
        type="button"
        onClick={() => onDrill(node.path)}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "flex",
          gap: 6,
          alignItems: "baseline",
          fontSize: 11.5,
        }}
      >
        <span style={{ ...ellipsis, maxWidth: 160, color: t.ink, fontWeight: 600 }}>
          {node.name}
        </span>
        <span style={{ fontFamily: numerals, color: t.faint }}>{node.count}</span>
        <span
          style={{
            fontFamily: numerals,
            color: node.max >= threshold ? hot : t.muted,
            marginLeft: "auto",
          }}
        >
          max {format(node.max, 0)}%
        </span>
      </button>
      {leaves ? (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 14px)`, gap: 3 }}>
          {node.children.map(item => renderCell(item, node))}
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-start" }}>
          {node.children.map(child => (
            <TileGroup
              key={child.id}
              t={t}
              node={child}
              color={color}
              onDrill={onDrill}
              renderCell={renderCell}
              nested
            />
          ))}
        </div>
      )}
    </div>
  )
}

const Frame = ({ t, title, subtitle, children, footer }) => (
  <div
    style={{
      background: t.panel,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      padding: "14px 16px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      fontFamily: font,
      color: t.ink,
    }}
  >
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 15, fontWeight: 600 }}>
        {title}{" "}
        <span style={{ color: t.muted, fontWeight: 400, fontSize: 13 }}>k8s.cgroup.cpu</span>
      </span>
      <span style={{ fontSize: 12, color: t.muted }}>{subtitle}</span>
    </div>
    {children}
    {footer}
  </div>
)

const Legend = ({ t, theme, max }) => (
  <div
    style={{
      display: "flex",
      gap: 14,
      alignItems: "center",
      fontSize: 11,
      color: t.muted,
      fontFamily: numerals,
    }}
  >
    <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
      0%
      <span style={{ display: "flex", borderRadius: 3, overflow: "hidden" }}>
        {scales[theme].map(step => (
          <span key={step} style={{ width: 16, height: 8, background: step }} />
        ))}
      </span>
      {format(max, 1)}%
    </span>
    <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: hot }} />≥ {threshold}%
    </span>
  </div>
)

const useHover = () => {
  const [hover, setHover] = useState(null)
  return [hover, setHover]
}

const scrollStyle = t => `
  .mockGroupBoxes-scroll { scrollbar-width: thin; scrollbar-color: ${t.faint} transparent; }
`

const TilesDirection = ({ t, theme, tree, max }) => {
  const [focus, setFocus] = useState([])
  const [hover, setHover] = useHover()
  const ref = useRef()
  const width = useWidth(ref)
  const color = useColor(theme, max)
  const node = findNode(tree, focus)
  const height = 380

  const renderCell = (item, group) => (
    <Cell
      key={item.id}
      item={item}
      color={color(item.value)}
      active={hover?.item.id === item.id}
      onHover={event => {
        const [x, y] = pointer(event, ref.current)
        setHover({ item, group, x, y })
      }}
      onLeave={() => setHover(null)}
    />
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Crumbs t={t} tree={tree} focus={focus} setFocus={setFocus} />
      <div ref={ref} style={{ position: "relative", color: t.ink }}>
        <div
          className="mockGroupBoxes-scroll"
          style={{
            height,
            overflowY: "auto",
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "flex-start",
            alignContent: "flex-start",
          }}
        >
          {(node.children[0]?.leaf ? [node] : node.children).map(child => (
            <TileGroup
              key={child.id}
              t={t}
              node={child}
              color={color}
              onDrill={setFocus}
              renderCell={renderCell}
            />
          ))}
        </div>
        <FloatingPopover
          hover={hover}
          width={width}
          height={height}
          t={t}
          theme={theme}
          max={max}
          hint={
            focus.length < hover?.group.path.length ? `Click ${hover.group.name} to drill in` : null
          }
        />
      </div>
    </div>
  )
}

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

const TreemapDirection = ({ t, theme, tree, max, sizing }) => {
  const [focus, setFocus] = useState([])
  const [hover, setHover] = useHover()
  const wrapper = useRef()
  const svgRef = useRef()
  const width = useWidth(wrapper)
  const color = useColor(theme, max)
  const height = 380

  useLayoutEffect(() => {
    if (!width) return
    const root = hierarchy(findNode(tree, focus))
      .sum(d => (d.leaf ? (sizing === "value" ? Math.max(d.value, 0.6) : 1) : 0))
      .sort((a, b) => b.value - a.value || (b.data.value ?? 0) - (a.data.value ?? 0))

    treemap()
      .size([width, height])
      .tile(treemapSquarify.ratio(1))
      .paddingOuter(3)
      .paddingTop(d => (d.depth === 0 ? 3 : 19))
      .paddingInner(d => (d.children?.[0]?.children ? 6 : 2))
      .round(true)(root)

    const svg = select(svgRef.current)
    const duration = reduced() ? 0 : 650
    const transition = svg.transition().duration(duration).ease(easeCubicInOut)

    const groupData = root.descendants().filter(d => d.depth > 0 && d.children)
    const groupSel = svg
      .select("g.groups")
      .selectAll("g.group")
      .data(groupData, d => d.data.id)
      .join(
        enter => {
          const g = enter
            .append("g")
            .attr("class", "group")
            .style("cursor", "zoom-in")
            .attr("opacity", 0)
            .attr("transform", d => `translate(${d.x0},${d.y0})`)
            .on("click", (_, d) => {
              setHover(null)
              setFocus(d.data.path)
            })
          g.append("rect").attr("rx", 5).attr("fill", "transparent")
          g.append("text").attr("x", 6).attr("y", 13).style("font", `600 11px ${font}`)
          g.append("text")
            .attr("class", "meta")
            .attr("y", 13)
            .attr("text-anchor", "end")
            .style("font", `500 11px ${numerals}`)
          return g
        },
        update => update,
        exit =>
          exit
            .transition()
            .duration(duration / 3)
            .attr("opacity", 0)
            .remove()
      )

    groupSel
      .transition(transition)
      .attr("opacity", 1)
      .attr("transform", d => `translate(${d.x0},${d.y0})`)
    groupSel
      .select("rect")
      .attr("stroke", t.border)
      .transition(transition)
      .attr("width", d => Math.max(0, d.x1 - d.x0))
      .attr("height", d => Math.max(0, d.y1 - d.y0))
    groupSel
      .select("text:not(.meta)")
      .attr("fill", t.ink)
      .text(d => {
        const room = Math.floor((d.x1 - d.x0 - 56) / 6.4)
        if (d.y1 - d.y0 < 22 || room < 2) return ""
        return middle(d.data.name, room)
      })
    groupSel
      .select("text.meta")
      .attr("fill", d => (d.data.max >= threshold ? hot : t.faint))
      .text(d => (d.x1 - d.x0 > 70 && d.y1 - d.y0 >= 22 ? `${d.data.count}` : ""))
      .transition(transition)
      .attr("x", d => d.x1 - d.x0 - 6)

    svg
      .select("g.leaves")
      .selectAll("rect")
      .data(root.leaves(), d => d.data.id)
      .join(
        enter =>
          enter
            .append("rect")
            .attr("rx", 2)
            .attr("opacity", 0)
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("width", d => Math.max(0, d.x1 - d.x0))
            .attr("height", d => Math.max(0, d.y1 - d.y0)),
        update => update,
        exit =>
          exit
            .transition()
            .duration(duration / 3)
            .attr("opacity", 0)
            .remove()
      )
      .on("mouseenter mousemove", (event, d) => {
        const [x, y] = pointer(event, wrapper.current)
        setHover({ item: d.data, group: d.parent.data, x, y })
      })
      .on("mouseleave", () => setHover(null))
      .on("click", (_, d) => {
        if (d.parent.depth === 0) return
        setHover(null)
        setFocus(d.parent.data.path)
      })
      .style("cursor", d => (d.parent.depth === 0 ? "default" : "zoom-in"))
      .attr("fill", d => color(d.data.value))
      .transition(transition)
      .attr("opacity", 1)
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("width", d => Math.max(0, d.x1 - d.x0))
      .attr("height", d => Math.max(0, d.y1 - d.y0))
  }, [width, focus, tree, theme, sizing])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Crumbs t={t} tree={tree} focus={focus} setFocus={setFocus} />
      <div ref={wrapper} style={{ position: "relative" }}>
        <svg ref={svgRef} width={width} height={height} style={{ display: "block" }}>
          <g className="groups" />
          <g className="leaves" />
        </svg>
        {hover && (
          <svg
            width={width}
            height={height}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            <HoverOutline svgRef={svgRef} id={hover.item.id} stroke={t.ink} />
          </svg>
        )}
        <FloatingPopover
          hover={hover}
          width={width}
          height={height}
          t={t}
          theme={theme}
          max={max}
          hint={
            hover?.group.path.length > focus.length
              ? `Click to zoom into ${hover.group.name}`
              : null
          }
        />
      </div>
    </div>
  )
}

const HoverOutline = ({ svgRef, id, stroke }) => {
  const [box, setBox] = useState(null)
  useLayoutEffect(() => {
    const match = select(svgRef.current)
      .select("g.leaves")
      .selectAll("rect")
      .filter(d => d.data.id === id)
      .node()
    setBox(match ? match.getBBox() : null)
  }, [id])
  if (!box) return null
  return (
    <rect
      x={box.x + 0.75}
      y={box.y + 0.75}
      width={Math.max(0, box.width - 1.5)}
      height={Math.max(0, box.height - 1.5)}
      rx="2"
      fill="none"
      stroke={stroke}
      strokeWidth="1.5"
    />
  )
}

const dodge = (items, x, radius) => {
  const placed = []
  const minDistance = (radius * 2 + 1) ** 2
  return [...items]
    .sort((a, b) => a.value - b.value)
    .map(item => {
      const cx = x(item.value)
      const near = placed.filter(p => Math.abs(p.cx - cx) < radius * 2 + 1)
      let cy = 0
      for (let k = 0; k < 400; k++) {
        cy = k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (radius / 1.5)
        if (near.every(p => (p.cx - cx) ** 2 + (p.cy - cy) ** 2 >= minDistance)) break
      }
      const dot = { item, cx, cy }
      placed.push(dot)
      return dot
    })
}

const Strip = ({
  t,
  node,
  x,
  color,
  radius,
  onHover,
  onLeave,
  onDrill,
  hoverId,
  plotWidth,
  drillable,
  index,
}) => {
  const dots = useMemo(() => dodge(node.leaves, x, radius), [node, x, radius])
  const extent = Math.max(...dots.map(dot => Math.abs(dot.cy)), 0)
  const height = Math.max(30, Math.ceil(extent * 2 + radius * 2 + 10))
  const median = node.leaves[Math.floor(node.leaves.length / 2)]?.value ?? 0
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px minmax(0, 1fr)",
        alignItems: "center",
        borderTop: `1px solid ${t.grid}`,
        animation: `mockGroupBoxes-rise 420ms ${index * 28}ms both ease-out`,
      }}
    >
      <button
        type="button"
        disabled={!drillable}
        onClick={() => onDrill(node.path)}
        style={{
          all: "unset",
          cursor: drillable ? "zoom-in" : "default",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          paddingRight: 12,
          minWidth: 0,
        }}
      >
        <span style={{ display: "flex", gap: 6, alignItems: "baseline", fontSize: 12 }}>
          <span style={{ ...ellipsis, fontWeight: 600 }}>{node.name}</span>
          <span style={{ fontFamily: numerals, color: t.faint }}>{node.count}</span>
        </span>
        <span style={{ fontFamily: numerals, fontSize: 11, color: t.muted }}>
          median {format(median, 1)}% · max{" "}
          <span style={{ color: node.max >= threshold ? hot : t.muted }}>
            {format(node.max, 0)}%
          </span>
        </span>
      </button>
      <svg width={plotWidth} height={height} style={{ display: "block", overflow: "visible" }}>
        <line
          x1={x(median)}
          x2={x(median)}
          y1={4}
          y2={height - 4}
          stroke={t.faint}
          strokeDasharray="2 3"
        />
        {dots.map(({ item, cx, cy }) => (
          <circle
            key={item.id}
            r={hoverId === item.id ? radius + 1.5 : radius}
            fill={color(item.value)}
            stroke={hoverId === item.id ? t.ink : t.panel}
            strokeWidth={hoverId === item.id ? 1.5 : 1}
            style={{ transform: `translate(${cx}px, ${height / 2 + cy}px)` }}
            onMouseEnter={event => onHover(event, item, node)}
            onMouseMove={event => onHover(event, item, node)}
            onMouseLeave={onLeave}
          />
        ))}
      </svg>
    </div>
  )
}

const StripsDirection = ({ t, theme, tree, max }) => {
  const [focus, setFocus] = useState([])
  const [hover, setHover] = useHover()
  const ref = useRef()
  const width = useWidth(ref)
  const color = useColor(theme, max)
  const node = findNode(tree, focus)
  const plotWidth = Math.max(0, width - 216)
  const x = useMemo(
    () =>
      scaleSymlog()
        .constant(2)
        .domain([0, max])
        .range([8, plotWidth - 8])
        .clamp(true),
    [max, plotWidth]
  )
  const rows = node.children[0]?.leaf ? [node] : node.children
  const height = 380
  const ticks = [0, 1, 2, 5, 10, 20, 50, 100].filter(
    tick => tick <= max && Math.abs(tick - threshold) > 15
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Crumbs t={t} tree={tree} focus={focus} setFocus={setFocus} />
      <div ref={ref} style={{ position: "relative" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "200px minmax(0, 1fr)",
            fontFamily: numerals,
            fontSize: 10.5,
            color: t.faint,
          }}
        >
          <span />
          <svg width={plotWidth} height={16}>
            {ticks.map(tick => (
              <text key={tick} x={x(tick)} y={11} textAnchor="middle" fill={t.faint}>
                {tick}%
              </text>
            ))}
            <text x={x(threshold)} y={11} textAnchor="middle" fill={hot}>
              {threshold}%
            </text>
          </svg>
        </div>
        <div
          className="mockGroupBoxes-scroll"
          style={{ height, overflowY: "auto", position: "relative" }}
        >
          <div
            style={{
              position: "absolute",
              left: 200 + x(threshold),
              top: 0,
              bottom: 0,
              borderLeft: `1px dashed ${hot}`,
              opacity: 0.5,
              pointerEvents: "none",
            }}
          />
          {rows.map((row, index) => (
            <Strip
              key={row.id}
              index={index}
              t={t}
              node={{ ...row, leaves: flattenLeaves(row).sort((a, b) => a.value - b.value) }}
              x={x}
              color={color}
              radius={3.5}
              plotWidth={plotWidth}
              hoverId={hover?.item.id}
              drillable={!row.children[0]?.leaf || row !== node}
              onDrill={setFocus}
              onHover={(event, item, group) => {
                const [px, py] = pointer(event, ref.current)
                setHover({ item, group: findNode(tree, group.path), x: px, y: py })
              }}
              onLeave={() => setHover(null)}
            />
          ))}
        </div>
        <FloatingPopover
          hover={hover}
          width={width}
          height={height}
          t={t}
          theme={theme}
          max={max}
          hint={null}
        />
      </div>
    </div>
  )
}

const directions = [
  {
    id: "tiles",
    title: "A. Tiles",
    note: "The classic look back: every group is a framed block of small squares, blocks wrap side by side, the body scrolls. Hottest boxes first inside each group. Click a group name to drill in.",
    Component: TilesDirection,
  },
  {
    id: "treemap",
    title: "B. Zoomable treemap",
    note: "d3 squarified treemap: every box visible at once, nested by each group-by level, no scrolling. Click a group to zoom it to fill the card; boxes glide to their new place. Breadcrumb zooms back out.",
    Component: TreemapDirection,
  },
  {
    id: "strips",
    title: "C. Distribution strips",
    note: "One row per group, each box placed by its value on a log-like axis (beeswarm), so idle pods spread out instead of piling at 0%. Shows where a group sits, its spread, and outliers past the threshold. Click a row to split it by the next group-by level.",
    Component: StripsDirection,
  },
]

const groupByOptions = {
  one: ["namespace"],
  two: ["namespace", "node"],
  three: ["namespace", "controller", "node"],
}

export const GroupBoxesMockups = ({
  theme = "dark",
  groupBy = "two",
  only = "all",
  sizing = "equal",
}) => {
  const t = themes[theme]
  const items = useMemo(makeItems, [])
  const levels = groupByOptions[groupBy]
  const tree = useMemo(() => buildTree(items, levels), [items, groupBy])
  const max = tree.max
  const sample = useMemo(() => {
    const group = findNode(tree, ["netdata"])
    const leaves = flattenLeaves(group)
    const item = leaves.find(leaf => leaf.labels.k8s_pod_name.length > 1) || leaves[0]
    return { item, group }
  }, [tree])

  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `${scrollStyle(t)} @keyframes mockGroupBoxes-rise { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } } @media (prefers-reduced-motion: reduce) { [style*="mockGroupBoxes-rise"] { animation: none !important; } }`
    document.head.appendChild(style)
    return () => style.remove()
  }, [theme])

  const subtitle = `Group by ${levels.map(level => `k8s_${level === "namespace" ? level : `${level}_name`}`).join(", ")}, Average, 12 nodes, ${items.length} instances`

  return (
    <div
      style={{
        background: t.ground,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 28,
        fontFamily: font,
        color: t.ink,
      }}
    >
      {(only === "all" || only === "popover") && (
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Popover</span>
          <span style={{ fontSize: 12, color: t.muted, maxWidth: 760 }}>
            Fixed 300px card. Where it sits, its value with the last minutes, its rank in the group
            and its place on the colour scale. One line per label; long value lists show the first
            value and a +N count (full list on the row title).
          </span>
          <Popover
            t={t}
            theme={theme}
            item={sample.item}
            group={sample.group}
            max={max}
            hint="Click netdata to drill in"
          />
        </section>
      )}
      {directions
        .filter(direction => only === "all" || only === direction.id)
        .map(({ id, title, note, Component }) => (
          <section key={id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
            <span style={{ fontSize: 12, color: t.muted, maxWidth: 760 }}>{note}</span>
            <Frame
              t={t}
              title="CPU Usage"
              subtitle={subtitle}
              footer={<Legend t={t} theme={theme} max={max} />}
            >
              <Component t={t} theme={theme} tree={tree} max={max} sizing={sizing} />
            </Frame>
          </section>
        ))}
    </div>
  )
}
