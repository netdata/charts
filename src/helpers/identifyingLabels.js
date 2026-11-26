export const labelPriority = ["k8s_pod_name", "k8s_controller_name"]

const missingCode = 0

const isSystemLabel = name => name.startsWith("_")

const makeCompare = priority => {
  const rankByName = new Map(priority.map((name, index) => [name, index]))
  const rankOf = name => (rankByName.has(name) ? rankByName.get(name) : priority.length)

  return (a, b) => rankOf(a) - rankOf(b) || (a < b ? -1 : a > b ? 1 : 0)
}

const getLabelNames = row => Object.keys(row.labels || {}).filter(name => !isSystemLabel(name))

const encodeRows = (rows, names) => {
  const codesByName = names.map(() => new Map())
  const missingByName = names.map(() => false)

  const encoded = rows.map(row => {
    const labels = row.labels || {}
    const codes = names.map((name, index) => {
      if (!(name in labels)) {
        missingByName[index] = true
        return missingCode
      }
      const valueCodes = codesByName[index]
      if (!valueCodes.has(labels[name])) valueCodes.set(labels[name], valueCodes.size + 1)
      return valueCodes.get(labels[name])
    })
    return { row, codes }
  })

  const separating = names
    .map((name, index) => index)
    .filter(index => codesByName[index].size + (missingByName[index] ? 1 : 0) > 1)

  return { encoded, separating }
}

const makeKey = (node, codes, indices) => {
  let key = node
  for (let index = 0; index < indices.length; index++) key += `,${codes[indices[index]]}`
  return key
}

const markDuplicates = (encoded, separating) => {
  const groups = new Map()
  encoded.forEach(item => {
    const key = makeKey(item.row.node, item.codes, separating)
    const group = groups.get(key)
    if (group) group.push(item)
    else groups.set(key, [item])
  })

  const ambiguousIds = new Set()
  const unique = []
  groups.forEach(group => {
    unique.push(group[0])
    if (group.length > 1) group.forEach(({ row }) => ambiguousIds.add(row.id))
  })

  return { unique, ambiguousIds }
}

const identifies = (unique, indices) => {
  const keys = new Set()
  for (let index = 0; index < unique.length; index++) {
    const key = makeKey(unique[index].row.node, unique[index].codes, indices)
    if (keys.has(key)) return false
    keys.add(key)
  }
  return true
}

const findCombination = (count, size, test) => {
  const positions = Array.from({ length: size }, (_, index) => index)

  for (;;) {
    if (test(positions)) return positions

    let position = size - 1
    while (position >= 0 && positions[position] === count - size + position) position--
    if (position < 0) return null

    positions[position]++
    for (let next = position + 1; next < size; next++) positions[next] = positions[next - 1] + 1
  }
}

const findWinner = (unique, separating, max) => {
  const limit = Math.min(max, separating.length)

  for (let size = 0; size <= limit; size++) {
    const positions = findCombination(separating.length, size, positions =>
      identifies(
        unique,
        positions.map(position => separating[position])
      )
    )
    if (positions) return positions
  }

  return null
}

const noAmbiguousIds = new Set()

const chooseDisplayed = (encoded, separating, max) => {
  const { unique } = markDuplicates(encoded, separating)
  const winner = findWinner(unique, separating, max)

  if (!winner) return separating.slice(0, max)

  const winnerPositions = new Set(winner)
  const fill = separating
    .map((index, position) => position)
    .filter(position => !winnerPositions.has(position))
    .slice(0, max - winner.length)

  return [...winner, ...fill].sort((a, b) => a - b).map(position => separating[position])
}

const getDisplayedIndices = (rows, names, max) => {
  const topIndices = names.map((name, index) => index).slice(0, max)
  if (rows.length < 2) return { displayed: topIndices, ambiguousIds: noAmbiguousIds }

  const { encoded, separating } = encodeRows(rows, names)
  const displayed = separating.length ? chooseDisplayed(encoded, separating, max) : topIndices

  return { displayed, ambiguousIds: markDuplicates(encoded, displayed).ambiguousIds }
}

const identifyGroup = (rows, compare, max, result) => {
  const names = [...new Set(rows.flatMap(getLabelNames))].sort(compare)
  const { displayed, ambiguousIds } = getDisplayedIndices(rows, names, max)
  const displayedNames = new Set(displayed.map(index => names[index]))

  rows.forEach(row => {
    const pairs = []
    const rest = []
    getLabelNames(row)
      .sort(compare)
      .forEach(name => (displayedNames.has(name) ? pairs : rest).push([name, row.labels[name]]))

    result[row.id] = { pairs, rest, ambiguous: ambiguousIds.has(row.id) }
  })
}

export const getIdentifyingLabels = (rows, { priority = labelPriority, max = 3 } = {}) => {
  const compare = makeCompare(priority)
  const rowsByContext = new Map()

  rows.forEach(row => {
    const group = rowsByContext.get(row.context)
    if (group) group.push(row)
    else rowsByContext.set(row.context, [row])
  })

  const result = {}
  rowsByContext.forEach(group => identifyGroup(group, compare, max, result))

  return result
}
