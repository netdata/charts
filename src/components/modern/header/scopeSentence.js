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

export const linesOf = ({ names, groupBy, groupByLabel = noValues }) => {
  const listed = listOrCount(names)
  if (isDimensionGrouping(groupBy)) return { ...listed, text: capitaliseFirst(listed.text) }

  const keys = [
    ...new Set(groupBy.flatMap(by => groupKeysOf[by]?.(groupByLabel) || [by]).filter(Boolean)),
  ]

  return { ...listed, perGroup: joinList(keys) }
}

export const belowZeroOf = ({ names, sts }) => {
  const below = names.filter((_, index) => sts?.max?.[index] <= 0 && sts?.min?.[index] < 0)
  return below.length ? joinList(below) : null
}

const nounOf = ({ count, nodesTotals, scopeCombines }) => {
  if (scopeCombines?.noun) return scopeCombines.noun
  return nodesTotals?.qr === count ? "nodes" : "instances"
}

export const combinedOf = ({
  names,
  groupBy,
  aggregationMethod,
  instancesTotals,
  nodesTotals,
  scopeCombines,
}) => {
  if (scopeCombines?.upstream) return { noun: scopeCombines.noun, verb: combinedVerbs.sum }

  const count = instancesTotals?.qr
  const linesFed = isDimensionGrouping(groupBy) ? 1 : names.length
  if (!(count > linesFed) || groupBy?.includes("instance")) return null

  return {
    noun: nounOf({ count, nodesTotals, scopeCombines }),
    count,
    verb: combinedVerbs[aggregationMethod] || "combined",
  }
}
