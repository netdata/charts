const aggregationLabels = {
  avg: "Average",
  sum: "Sum",
  percentage: "Percentage",
  min: "Minimum",
  max: "Maximum",
}

const timeAggregationLabels = {
  average: "Average",
  avg: "Average",
  min: "Minimum",
  max: "Maximum",
  sum: "Sum",
  latest: "Latest",
  median: "Median",
  "trimmed-median": "Trimmed median",
  "trimmed-mean": "Trimmed mean",
  percentile: "Percentile",
  stddev: "Standard deviation",
  cv: "Coefficient of variation",
  "incremental-sum": "Delta",
  ses: "Single exponential smoothing",
  des: "Double exponential smoothing",
}

// mirrors the label the GroupBy dropdown shows, so the folded line reads like the open bar
export const getGroupByLabel = (groupBy = [], groupByLabel = []) => {
  const withoutNodes = groupBy.filter(value => value !== "node")
  const groups = withoutNodes.map(value => {
    if (value === "label")
      return groupByLabel.length > 1 ? `${groupByLabel.length} labels` : groupByLabel[0]
    return value
  })
  if (withoutNodes.length < groupBy.length) groups.push("node")

  const label = groups.filter(Boolean).join(", ")
  return label ? `Group by ${label}` : ""
}

export const getTimeAggregationLabel = (groupingMethod = "", viewUpdateEvery) => {
  const [method = "", alias = ""] = groupingMethod.match(/[\d.]+|\D+/g) || []
  if (!method) return ""

  const label = timeAggregationLabels[method] || method
  const withAlias = alias ? `${label} ${alias}` : label
  return viewUpdateEvery ? `${withAlias} every ${viewUpdateEvery}s` : withAlias
}

const countPart = (totals, key, intl) => {
  const count = totals?.qr
  if (!count) return ""
  return `${count} ${intl(key, { count })}`
}

export const getScopeParts = (attributes = {}, intl = key => key) => {
  const {
    groupBy,
    groupByLabel,
    aggregationMethod,
    nodesTotals,
    instancesTotals,
    dimensionsTotals,
    labelsTotals,
    groupingMethod,
    viewUpdateEvery,
  } = attributes

  return [
    getGroupByLabel(groupBy, groupByLabel),
    aggregationLabels[aggregationMethod] || aggregationMethod || "",
    countPart(nodesTotals, "node", intl),
    countPart(instancesTotals, "instance", intl),
    countPart(dimensionsTotals, "dimension", intl),
    countPart(labelsTotals, "label", intl),
    getTimeAggregationLabel(groupingMethod, viewUpdateEvery),
  ].filter(Boolean)
}
