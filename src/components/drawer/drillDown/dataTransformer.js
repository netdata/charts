export const transformWeightsData = (weightsResponse, groupByOrder) => {
  if (!weightsResponse?.result || !groupByOrder?.length) return []

  const { result } = weightsResponse
  
  return result.map(item => {
    const { id, nm, v } = item
    
    const groupedValues = id.split(",")
    const weightStats = v[0] || []
    const timeframeStats = v[1] || []

    const groupedByFields = groupByOrder.reduce((acc, field, index) => {
      acc[field] = groupedValues[index] || ""
      return acc
    }, {})

    return {
      id,
      nm,
      label: groupedByFields[groupByOrder[0]] || nm,
      groupedBy: groupedByFields,
      weight: {
        min: weightStats[0],
        avg: weightStats[1], 
        max: weightStats[2],
        sum: weightStats[3],
        count: weightStats[4]
      },
      timeframe: {
        min: timeframeStats[0],
        avg: timeframeStats[1],
        max: timeframeStats[2], 
        sum: timeframeStats[3],
        count: timeframeStats[4],
        anomaly_count: timeframeStats[5]
      },
      anomalyRate: timeframeStats[4] > 0 ? (timeframeStats[5] * 100 / timeframeStats[4]) : 0,
      contribution: weightStats[3],
      level: 0,
      parentId: null,
    }
  })
}

export const buildHierarchicalTree = (flatData, groupByOrder) => {
  if (!groupByOrder?.length) return flatData

  const itemsByLevel = flatData.reduce((acc, item) => {
    const { groupedBy } = item
    
    groupByOrder.reduce((parentKeys, field, level) => {
      const value = groupedBy[field]
      const levelKey = [...parentKeys, value].join("|")
      
      if (!acc[levelKey]) {
        acc[levelKey] = {
          ...item,
          id: levelKey,
          label: value,
          level,
          parentId: level > 0 ? parentKeys.join("|") : null,
          children: [],
          isGroupNode: level < groupByOrder.length - 1
        }
      }
      
      if (level === groupByOrder.length - 1) {
        acc[levelKey] = { ...item, level, parentId: parentKeys.join("|"), isGroupNode: false }
      }
      
      return [...parentKeys, value]
    }, [])
    
    return acc
  }, {})
  
  return Object.values(itemsByLevel).reduce((tree, item) => {
    if (item.parentId && itemsByLevel[item.parentId]) {
      itemsByLevel[item.parentId].children.push(item)
    } else if (!item.parentId) {
      tree.push(item)
    }
    return tree
  }, [])
}