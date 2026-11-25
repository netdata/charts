const maxListed = 3
const previewCount = 2
const noValues = []

const identity = value => value

const combinedVerbs = {
  sum: "added up",
  avg: "averaged",
  min: "lowest of them",
  max: "highest of them",
  percentage: "as a share of the total",
}

const eachVerbs = {
  sum: "adds up",
  avg: "averages",
  min: "takes the lowest of",
  max: "takes the highest of",
  percentage: "shows its share of",
}

const groupKeysOf = {
  label: groupByLabel => groupByLabel,
  "percentage-of-instance": () => ["instance"],
}

export const capitaliseFirst = text => text.charAt(0).toUpperCase() + text.slice(1)

export const joinList = names =>
  names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`

export const listOrCount = names =>
  names.length <= maxListed
    ? { text: joinList(names), more: [] }
    : {
        text: `${names.slice(0, previewCount).join(", ")} and ${names.length - previewCount} more`,
        more: names.slice(previewCount),
      }

export const describeSelection = ({
  selected,
  all,
  labelForValue = identity,
  allowAllExcept = true,
}) => {
  const selectedSet = new Set(selected)
  const included = all.filter(value => selectedSet.has(value))
  const excluded = all.filter(value => !selectedSet.has(value))

  if (!included.length || !excluded.length) return null

  const allExcept =
    allowAllExcept && included.length > maxListed && excluded.length < included.length
  const listed = listOrCount((allExcept ? excluded : included).map(labelForValue))

  return {
    text: allExcept ? `all except ${listed.text}` : listed.text,
    more: listed.more,
    allExcept,
  }
}

const filtersOf = (matchType, values) => values.map(value => ({ matchType, value }))

const partOf = ({ all, selected, labelForValue, prefix = "" }) => {
  const describe = (values, allowAllExcept) =>
    describeSelection({ selected: values, all, labelForValue, allowAllExcept })
  const included = describe(selected, true)
  if (!included) return null

  const hidden = describe(
    all.filter(value => !selected.includes(value)),
    false
  )
  const text = `${prefix}${included.allExcept ? included.text : `only ${included.text}`}`

  return {
    chip: { text, more: included.more },
    hides: included.allExcept ? null : { text: hidden.text, more: hidden.more },
  }
}

export const dimensionPartsOf = ({ dimensions, selectedDimensions }) => {
  if (!selectedDimensions.length) return noValues

  const ids = Object.keys(dimensions || {})
  const nameOf = id => dimensions[id].nm || id
  const selected = ids.filter(
    id => selectedDimensions.includes(id) || selectedDimensions.includes(nameOf(id))
  )
  const part = partOf({ all: ids, selected, labelForValue: nameOf })

  return part
    ? [{ key: "dimensions", ...part, filters: filtersOf("dimensions", selectedDimensions) }]
    : noValues
}

export const labelKeyOf = value => value.slice(0, value.indexOf(":"))

export const labelPartsOf = ({ labels, selectedLabels }) =>
  [...new Set(selectedLabels.map(labelKeyOf))].flatMap(key => {
    const all = (labels?.[key]?.vl || noValues).map(({ id }) => id)
    const selected = all.filter(id => selectedLabels.includes(`${key}:${id}`))
    const part = partOf({ all, selected, prefix: `${key}: ` })
    if (!part) return noValues

    const values = describeSelection({ selected, all, allowAllExcept: false })
    const filters = filtersOf(
      "labels",
      selectedLabels.filter(value => labelKeyOf(value) === key)
    )

    return [
      {
        key: `label-${key}`,
        ...part,
        inline: { text: values.text, label: `${key}: ${values.text}`, more: values.more },
        filters,
      },
    ]
  })

const isDimensionGrouping = groupBy => !groupBy?.length || groupBy.every(by => by === "dimension")

export const isGrouped = groupBy => !isDimensionGrouping(groupBy)

export const linesOf = ({ names, groupBy, groupByLabel = noValues, scopeCombines }) => {
  const listed = listOrCount(names)
  if (isDimensionGrouping(groupBy)) return { ...listed, text: capitaliseFirst(listed.text) }

  const instanceName = scopeCombines?.nounSingular || "instance"
  const keys = [
    ...new Set(
      groupBy
        .flatMap(by => groupKeysOf[by]?.(groupByLabel) || [by])
        .filter(Boolean)
        .map(key => (key === "instance" ? instanceName : key))
    ),
  ]
  const members = names.length <= maxListed ? names.join(", ") : listed.text

  return { ...listed, text: `Per ${joinList(keys)}: ${members}` }
}

export const belowZeroOf = ({ names, sts }) => {
  const below = names.filter((_, index) => sts?.max?.[index] <= 0 && sts?.min?.[index] < 0)
  return below.length ? joinList(below) : null
}

const nounOf = ({ count, nodesTotals, scopeCombines }) => {
  if (scopeCombines?.noun) return scopeCombines.noun
  return nodesTotals?.qr === count ? "nodes" : "instances"
}

const sameCount = counts =>
  counts.length && counts.every(count => count === counts[0]) ? counts[0] : null

const instancesPerSeriesOf = ({ groupBy, aggregated, dimensions, nodes }) => {
  if (groupBy.length === 1 && groupBy[0] === "node")
    return sameCount(
      Object.values(nodes || {})
        .map(node => node.is?.qr)
        .filter(count => count > 0)
    )

  const metricsAreInstances =
    groupBy.includes("dimension") || Object.keys(dimensions || {}).length === 1
  return metricsAreInstances && Array.isArray(aggregated) ? sameCount(aggregated) : null
}

export const combinedOf = ({
  names,
  groupBy,
  aggregationMethod,
  instancesTotals,
  nodesTotals,
  scopeCombines,
  aggregated,
  dimensions,
  nodes,
}) => {
  const grouped = isGrouped(groupBy)

  if (scopeCombines?.upstream)
    return grouped
      ? { noun: scopeCombines.noun, grouped, quantity: "all", verb: eachVerbs.sum }
      : { noun: scopeCombines.noun, verb: combinedVerbs.sum }

  const count = instancesTotals?.qr
  const seriesFed = grouped ? names.length : 1
  if (!(count > seriesFed) || groupBy?.includes("instance")) return null

  const noun = nounOf({ count, nodesTotals, scopeCombines })

  if (!grouped) return { noun, count, verb: combinedVerbs[aggregationMethod] || "combined" }

  const verb = eachVerbs[aggregationMethod] || "combines"
  const perSeries = instancesPerSeriesOf({ groupBy, aggregated, dimensions, nodes })
  return perSeries
    ? { noun, grouped, count: perSeries, verb }
    : { noun, grouped, quantity: "its", verb }
}
