export default chart => {
  const {
    keys,
    labels: labelValues,
    result: { postAggregatedData = {} },
  } = chart.getPayload()
  const { groupBy, postGroupBy, aggregationGroups, filteredRows } = chart.getAttributes()
  const groupValues = keys[groupBy.filter(group => /k8s_/.test(group))[0]]
  const postGroupValues = keys[postGroupBy]

  if (!groupValues || !postGroupValues) return { labels: [], data: [], chartLabels: {} }

  const postAggregatedValues = postAggregatedData[Object.keys(postAggregatedData)[0]]
  const indexes = filteredRows || [...Array(groupValues.length)].map((v, index) => index)

  const postGroupData = indexes.reduce((acc, index) => {
    const groupValue = groupValues[index]
    if (!(groupValue in acc)) {
      acc[groupValue] = {
        labels: [],
        indexes: [],
        chartLabels: [],
        postAggregations: [],
      }
    }
    const boxes = acc[groupValue]
    boxes.indexes.push(index)
    boxes.labels.push(postGroupValues[index])
    boxes.postAggregations.push(postAggregatedValues[index])

    const chartLabels = aggregationGroups.reduce((labelsAcc, label) => {
      if (labelValues[label]?.[index]) {
        labelsAcc[label] = labelValues[label][index]
      }
      return labelsAcc
    }, {})
    boxes.chartLabels.push(chartLabels)
    return acc
  }, {})

  const labels = Object.keys(postGroupData).sort(
    (a, b) => postGroupData[b].indexes.length - postGroupData[a].indexes.length
  )

  const groupData = labels.map(label => postGroupData[label])

  const groupChartLabels = groupData.map(boxes => {
    return aggregationGroups.reduce((acc, label) => {
      const groupLabels = new Set(
        boxes.chartLabels.reduce(
          (accChartLabels, chartLabels) =>
            chartLabels[label] ? [...accChartLabels, ...chartLabels[label]] : accChartLabels,
          []
        )
      )

      if (groupLabels.size > 0) {
        acc[label] = Array.from(groupLabels)
      }
      return acc
    }, {})
  })

  return { labels, data: groupData, chartLabels: groupChartLabels }
}
