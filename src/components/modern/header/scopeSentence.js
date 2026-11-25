import { uppercase } from "@/helpers/objectTransform"

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

const labelGroupPrefix = "label:"
const instanceGroupings = new Set(["instance", "percentage-of-instance"])

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

  const selectedSet = new Set(selected)
  const hidden = describe(
    all.filter(value => !selectedSet.has(value)),
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
  const selectedSet = new Set(selectedDimensions)
  const selected = ids.filter(id => selectedSet.has(id) || selectedSet.has(nameOf(id)))
  const part = partOf({ all: ids, selected, labelForValue: nameOf })

  return part
    ? [{ key: "dimensions", ...part, filters: filtersOf("dimensions", selectedDimensions) }]
    : noValues
}

export const labelKeyOf = value => value.slice(0, value.indexOf(":"))

const selectedByKeyOf = selectedLabels =>
  selectedLabels.reduce((byKey, value) => {
    const key = labelKeyOf(value)
    const values = byKey.get(key)
    if (values) values.push(value)
    else byKey.set(key, [value])
    return byKey
  }, new Map())

export const labelPartsOf = ({ labels, selectedLabels }) => {
  const selectedSet = new Set(selectedLabels)

  return [...selectedByKeyOf(selectedLabels)].flatMap(([key, keySelections]) => {
    const all = (labels?.[key]?.vl || noValues).map(({ id }) => id)
    const selected = all.filter(id => selectedSet.has(`${key}:${id}`))
    const part = partOf({ all, selected, prefix: `${key}: ` })
    if (!part) return noValues

    const values = describeSelection({ selected, all, allowAllExcept: false })

    return [
      {
        key: `label-${key}`,
        ...part,
        inline: { text: values.text, label: `${key}: ${values.text}`, more: values.more },
        filters: filtersOf("labels", keySelections),
      },
    ]
  })
}

const isDimensionGrouping = grouped => !grouped?.length || grouped.every(by => by === "dimension")

export const isGrouped = grouped => !isDimensionGrouping(grouped)

const groupKeyOf = (by, instanceName) => {
  if (by.startsWith(labelGroupPrefix)) return by.slice(labelGroupPrefix.length)
  return instanceGroupings.has(by) ? instanceName : by
}

export const linesOf = ({ names, grouped, scopeCombines }) => {
  const listed = listOrCount(names)
  if (isDimensionGrouping(grouped)) return { ...listed, text: uppercase(listed.text) }

  const instanceName = scopeCombines?.nounSingular || "instance"
  const keys = [...new Set(grouped.map(by => groupKeyOf(by, instanceName)))]
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

const sameCount = counts => (counts.every(count => count === counts[0]) ? counts[0] : null)

const instancesPerSeriesOf = ({ grouped, aggregated, dimensions, nodes }) => {
  if (grouped.length === 1 && grouped[0] === "node") {
    const counts = Object.values(nodes || {})
      .map(node => node.is?.qr)
      .filter(count => count > 0)
    return counts.length ? counts : null
  }

  const metricsAreInstances =
    grouped.includes("dimension") || Object.keys(dimensions || {}).length === 1
  return metricsAreInstances && aggregated?.length ? aggregated : null
}

const groupedCombinedOf = ({ names, count, grouped, aggregated, dimensions, nodes }) => {
  const perSeries = instancesPerSeriesOf({ grouped, aggregated, dimensions, nodes })
  if (!perSeries) return count > names.length ? { quantity: "its" } : null
  if (!perSeries.some(instances => instances > 1)) return null

  const sharedCount = sameCount(perSeries)
  return sharedCount ? { count: sharedCount } : { quantity: "its" }
}

export const combinedOf = ({
  names,
  grouped,
  aggregationMethod,
  instancesTotals,
  nodesTotals,
  scopeCombines,
  aggregated,
  dimensions,
  nodes,
}) => {
  const perGroup = isGrouped(grouped)

  if (scopeCombines?.upstream)
    return perGroup
      ? { noun: scopeCombines.noun, grouped: perGroup, quantity: "all", verb: eachVerbs.sum }
      : { noun: scopeCombines.noun, verb: combinedVerbs.sum }

  const count = instancesTotals?.qr
  const noun = nounOf({ count, nodesTotals, scopeCombines })

  if (!perGroup)
    return count > 1 ? { noun, count, verb: combinedVerbs[aggregationMethod] || "combined" } : null

  if (grouped.includes("instance")) return null

  const each = groupedCombinedOf({ names, count, grouped, aggregated, dimensions, nodes })
  return each
    ? { noun, grouped: perGroup, verb: eachVerbs[aggregationMethod] || "combines", ...each }
    : null
}
