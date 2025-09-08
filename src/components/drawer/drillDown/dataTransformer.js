const sanitizeValue = value => {
  if (value === Infinity || value === -Infinity || !Number.isFinite(value)) {
    return null
  }
  return value
}

export const transformWeightsData = (weightsResponse, groupByOrder, chart) => {
  if (!weightsResponse?.result || !groupByOrder?.length) return []

  const { result, v_schema } = weightsResponse

  const weightIndex = v_schema?.items?.findIndex(item => item.name === "weight") ?? 0
  const timeframeIndex = v_schema?.items?.findIndex(item => item.name === "timeframe") ?? 1
  const nodes = chart.getAttribute("nodes", [])

  return result.map(item => {
    const { id, nm, v } = item

    const groupedValues = id.split(",")
    const groupedNames = nm.split(",")
    const weightStats = v[weightIndex] || []
    const timeframeStats = v[timeframeIndex] || []

    const groupedByFields = groupByOrder.reduce((acc, field, index) => {
      acc[field] = groupedValues[index] || ""
      return acc
    }, {})

    const groupedByNames = groupByOrder.reduce((acc, field, index) => {
      acc[field] = groupedNames[index] || groupedValues[index] || ""
      if (field === "node") {
        debugger
        acc[field] = nodes[acc[field]]?.nm || acc[field]
      }
      return acc
    }, {})

    return {
      id,
      nm,
      label: groupedByNames[groupByOrder[0]] || nm,
      groupedBy: groupedByFields,
      groupedByNames,
      weight: {
        min: weightStats[0],
        avg: weightStats[1],
        max: weightStats[2],
        sum: weightStats[3],
        count: weightStats[4],
      },
      timeframe: {
        min: sanitizeValue(timeframeStats[0]),
        avg: sanitizeValue(timeframeStats[1]),
        max: sanitizeValue(timeframeStats[2]),
        sum: sanitizeValue(timeframeStats[3]),
        count: sanitizeValue(timeframeStats[4]),
        anomaly_count: sanitizeValue(timeframeStats[5]),
      },
      anomalyRate: timeframeStats[4] > 0 ? (timeframeStats[5] * 100) / timeframeStats[4] : 0,
      contribution: weightStats[3],
      level: 0,
      parentId: null,
    }
  })
}

const aggregateStats = (statsArray, statType) => {
  if (!statsArray.length) return null

  const values = statsArray.filter(stats => stats && typeof stats === "object")
  if (!values.length) return null

  return {
    min: Math.min(...values.map(s => s.min).filter(v => v != null)),
    max: Math.max(...values.map(s => s.max).filter(v => v != null)),
    sum: values.reduce((acc, s) => acc + (s.sum || 0), 0),
    avg:
      statType === "weight"
        ? values.reduce((acc, s) => acc + (s.sum || 0), 0) /
            values.filter(s => s.count > 0).length || 0
        : values.reduce((acc, s) => acc + (s.avg || 0) * (s.count || 0), 0) /
            values.reduce((acc, s) => acc + (s.count || 0), 0) || 0,
    count: values.reduce((acc, s) => acc + (s.count || 0), 0),
    anomaly_count:
      statType === "timeframe"
        ? values.reduce((acc, s) => acc + (s.anomaly_count || 0), 0)
        : undefined,
  }
}

export const buildHierarchicalTree = (flatData, groupByOrder) => {
  if (!groupByOrder?.length) return flatData

  const nodesByKey = {}
  const allLeafItems = []

  flatData.forEach(item => {
    const { groupedBy, groupedByNames } = item

    groupByOrder.forEach((field, level) => {
      const pathValues = groupByOrder.slice(0, level + 1).map(f => groupedBy[f])
      const nodeKey = pathValues.join("|")
      const parentKey = level > 0 ? pathValues.slice(0, -1).join("|") : null

      if (!nodesByKey[nodeKey]) {
        nodesByKey[nodeKey] = {
          id: nodeKey,
          nm: nodeKey,
          label: groupedByNames[field],
          level,
          parentId: parentKey,
          children: [],
          isGroupNode: level < groupByOrder.length - 1,
          groupedBy: groupByOrder.slice(0, level + 1).reduce((acc, f, idx) => {
            acc[f] = pathValues[idx]
            return acc
          }, {}),
          groupedByNames: groupByOrder.slice(0, level + 1).reduce((acc, f, idx) => {
            acc[f] = idx === level ? groupedByNames[field] : item.groupedByNames[f]
            return acc
          }, {}),
        }
      }
    })

    const leafKey = groupByOrder.map(f => item.groupedBy[f]).join("|")
    nodesByKey[leafKey] = {
      ...item,
      id: leafKey,
      label: item.groupedByNames[groupByOrder[groupByOrder.length - 1]] || item.label,
      level: groupByOrder.length - 1,
      parentId:
        groupByOrder.length > 1
          ? groupByOrder
              .slice(0, -1)
              .map(f => item.groupedBy[f])
              .join("|")
          : null,
      isGroupNode: false,
    }
    allLeafItems.push(item)
  })

  Object.values(nodesByKey).forEach(node => {
    if (node.isGroupNode) {
      const belongingItems = allLeafItems.filter(item => {
        return groupByOrder.slice(0, node.level + 1).every((field, idx) => {
          const nodeValue = node.groupedBy[field]
          const itemValue = item.groupedBy[field]
          return nodeValue === itemValue
        })
      })

      if (belongingItems.length > 0) {
        const weightStats = aggregateStats(
          belongingItems.map(item => item.weight),
          "weight"
        )
        const timeframeStats = aggregateStats(
          belongingItems.map(item => item.timeframe),
          "timeframe"
        )

        if (weightStats) {
          node.weight = weightStats
          node.contribution = weightStats.sum
        }

        if (timeframeStats) {
          node.timeframe = timeframeStats
          node.anomalyRate =
            timeframeStats.count > 0
              ? (timeframeStats.anomaly_count * 100) / timeframeStats.count
              : 0
        }
      }
    }
  })

  const tree = []
  Object.values(nodesByKey).forEach(node => {
    if (node.parentId && nodesByKey[node.parentId]) {
      nodesByKey[node.parentId].children.push(node)
    } else if (!node.parentId) {
      tree.push(node)
    }
  })

  return tree
}
