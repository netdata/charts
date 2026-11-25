import { uppercase } from "@/helpers/objectTransform"
import { splitGroupKeys } from "@/sdk/makeChart/camelizePayload"

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

const dimensionGrouping = "dimension"

const isDimensionGrouping = grouped =>
  !grouped?.length || grouped.every(by => by === dimensionGrouping)

export const isGrouped = grouped => !isDimensionGrouping(grouped)

const groupKeyOf = (by, instanceName) => {
  if (by.startsWith(labelGroupPrefix)) return by.slice(labelGroupPrefix.length)
  return instanceGroupings.has(by) ? instanceName : by
}

const nameAsIs = (_, name) => name

const isBelowZero = (sts, index) => sts?.max?.[index] <= 0 && sts?.min?.[index] < 0

const unknownPriority = Infinity

const membersOf = values => [...values.values()].map(({ name }) => name)

const addMember = (values, id, name, index) => {
  const member = values.get(id)
  if (member) member.series.push(index)
  else values.set(id, { name, series: [index] })
}

const groupsOf = ({ ids, names, grouped, scopeCombines, dimensions, nodeNameOf }) => {
  const instanceName = scopeCombines?.nounSingular || "instance"
  const dimensionValues = new Map()
  const keyValues = new Map()

  ids.forEach((id, index) => {
    const idParts = splitGroupKeys(id, grouped.length)
    const nameParts = splitGroupKeys(names[index] ?? id, grouped.length)

    grouped.forEach((by, part) => {
      const idPart = idParts[part] ?? id
      const namePart = nameParts[part] ?? idPart

      if (by === dimensionGrouping) return addMember(dimensionValues, idPart, namePart, index)

      const key = groupKeyOf(by, instanceName)
      if (!keyValues.has(key)) keyValues.set(key, new Map())
      const name = by === "node" ? nodeNameOf(idPart, namePart) : namePart
      addMember(keyValues.get(key), idPart, name, index)
    })
  })

  const priorityOf = id => dimensions?.[id]?.pri ?? unknownPriority
  const orderedDimensions = [...dimensionValues].sort(
    ([left], [right]) => priorityOf(left) - priorityOf(right)
  )

  return { dimensionValues: orderedDimensions.map(([, member]) => member), keyValues }
}

const membersText = members =>
  members.length <= maxListed ? members.join(", ") : listOrCount(members).text

const headingOf = ({ dimensionValues, keyValues }, subjectOf) => {
  const keys = [...keyValues.keys()]
  if (!dimensionValues.length && keys.length === 1) return `Per ${keys[0]}: `

  const counts = [...keyValues.values()].map(values => values.size).join(" × ")
  const per = `per ${joinList(keys)} (${counts}): `
  if (!dimensionValues.length) return uppercase(per)

  return `${uppercase(subjectOf(dimensionValues.map(({ name }) => name)))} ${per}`
}

export const linesOf = ({
  ids,
  names,
  grouped,
  scopeCombines,
  dimensions,
  nodeNameOf = nameAsIs,
}) => {
  if (isDimensionGrouping(grouped))
    return {
      heading: "",
      members: uppercase(listOrCount(names).text),
      full: uppercase(joinList(names)),
    }

  const groups = groupsOf({
    ids: ids || names,
    names,
    grouped,
    scopeCombines,
    dimensions,
    nodeNameOf,
  })
  const members = membersOf(groups.keyValues.values().next().value)

  return {
    heading: headingOf(groups, values => listOrCount(values).text),
    members: membersText(members),
    full: `${headingOf(groups, joinList)}${members.join(", ")}`,
  }
}

export const belowZeroOf = ({ ids, names, grouped, sts, dimensions }) => {
  if (isDimensionGrouping(grouped) || grouped.length === 1) {
    const below = names.filter((_, index) => isBelowZero(sts, index))
    return below.length ? joinList(below) : null
  }

  if (!grouped.includes(dimensionGrouping)) return null

  const { dimensionValues } = groupsOf({
    ids: ids || names,
    names,
    grouped,
    dimensions,
    nodeNameOf: nameAsIs,
  })
  const below = dimensionValues
    .filter(({ series }) => series.every(index => isBelowZero(sts, index)))
    .map(({ name }) => name)

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
