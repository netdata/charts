import tableFixture from "./table"

const copy = payload => JSON.parse(JSON.stringify(payload))

const dimensionKeys = ["ids", "names", "units", "priorities", "aggregated"]

export const withoutDimensions = (payload, ids = []) => {
  const next = copy(payload)
  const { dimensions } = next.view
  const indexes = ids
    .map(id => dimensions.ids.indexOf(id))
    .filter(index => index !== -1)
    .sort((a, b) => b - a)

  indexes.forEach(index => {
    dimensionKeys.forEach(key => {
      if (Array.isArray(dimensions[key])) dimensions[key].splice(index, 1)
    })
    Object.values(dimensions.sts || {}).forEach(values => {
      if (Array.isArray(values)) values.splice(index, 1)
    })
    next.result.labels.splice(index + 1, 1)
    next.result.data.forEach(row => row.splice(index + 1, 1))
  })

  return next
}

export const withValue = (payload, id, value) => {
  const next = copy(payload)
  const index = next.view.dimensions.ids.indexOf(id)
  if (index === -1) return next

  const valueIndex = next.result.point?.value ?? 0
  next.result.data.forEach(row => {
    const cell = row[index + 1]
    if (Array.isArray(cell)) cell[valueIndex] = value
    else row[index + 1] = value
  })

  return next
}

export const withNodeAlerts = (payload, alertsByIndex = {}) => {
  const next = copy(payload)
  Object.keys(alertsByIndex).forEach(index => {
    const node = next.summary.nodes[index]
    if (node) node.al = alertsByIndex[index]
  })
  return next
}

export const findDimension = (payload, matcher) => payload.view.dimensions.ids.find(matcher)

export const makeTablePayload = () => {
  const base = tableFixture[0]
  const hotId = findDimension(base, id => id.startsWith("utilization,sda,"))
  const missingId = findDimension(
    base,
    id => id.startsWith("writes,dm-0,") && id.endsWith(",disk.await")
  )

  return withNodeAlerts(withValue(withoutDimensions(base, [missingId]), hotId, 93.4), {
    1: { cl: 3, wr: 1 },
    2: { cl: 2, wr: 1, cr: 1 },
  })
}

export default makeTablePayload
