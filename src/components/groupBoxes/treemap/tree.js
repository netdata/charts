const unknownLevel = { kind: "unknown", key: "" }

const toLevel = grouped =>
  grouped.startsWith("label:")
    ? { kind: "label", key: grouped.slice("label:".length) }
    : { kind: grouped, key: grouped }

export const getLevels = grouped => (Array.isArray(grouped) ? grouped.map(toLevel) : [])

export const findNode = (nodes, value) => {
  const entry = Object.entries(nodes || {}).find(
    ([, node]) => node.mg === value || node.nd === value
  )
  return entry ? { key: entry[0], node: entry[1] } : null
}

export const getBoxIds = payload => payload.labels.slice(1, payload.labels.length - 2)

const displayName = (level, value, nodes) =>
  level.kind === "node" ? findNode(nodes, value)?.node.nm || value : value

const countLeaves = group => {
  group.count = group.children.reduce(
    (total, child) => total + (child.leaf ? 1 : countLeaves(child)),
    0
  )
  return group.count
}

export const buildBoxTree = (ids, grouped, nodes) => {
  const levels = getLevels(grouped)
  const groupDepth = Math.max(levels.length - 1, 0)
  const root = {
    id: "",
    name: "",
    value: "",
    level: unknownLevel,
    path: [],
    children: [],
    count: 0,
  }
  const groups = { "": root }

  ids.forEach(id => {
    const parts = id.split(",")
    let parent = root

    parts.slice(0, Math.min(groupDepth, parts.length - 1)).forEach((value, depth) => {
      const path = [...parent.path, value]
      const key = path.join(",")
      if (!groups[key]) {
        const level = levels[depth] || unknownLevel
        groups[key] = {
          id: key,
          name: displayName(level, value, nodes),
          value,
          level,
          path,
          children: [],
          count: 0,
        }
        parent.children.push(groups[key])
      }
      parent = groups[key]
    })

    const depth = parent.path.length
    const value = parts.slice(depth).join(",")
    const leafValue =
      parts.length > levels.length && levels.length ? parts[parts.length - 1] : value
    const level = levels[depth] || unknownLevel
    parent.children.push({
      id,
      name: displayName(level, leafValue, nodes),
      value: leafValue,
      level,
      path: [...parent.path, leafValue],
      leaf: true,
    })
  })

  countLeaves(root)
  return root
}

export const findGroup = (root, path) =>
  path.reduce(
    (group, value) => group?.children.find(child => !child.leaf && child.value === value) || null,
    root
  )
