const buildTree = (h, keys, id) => {
  const [key, ...subKeys] = keys

  if (!h[key] && !subKeys.length) {
    h[key] = id
    return h
  }

  if (!h[key]) h[key] = {}

  h[key] = buildTree(h[key], subKeys, id)
  return h
}

export default chart => {
  const { data, labels, all } = chart.getPayload()
  const {
    viewDimensions = {}, // set default value
    viewDimensions: { ids: dimensionIds = [] },
  } = chart.getAttributes()

  const tree = dimensionIds.reduce((h, id) => {
    const keys = id.split(",")

    return buildTree(h, keys, id)
  }, {})

  return { labels, data, tree, all }
}
