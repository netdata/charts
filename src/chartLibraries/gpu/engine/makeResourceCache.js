export default () => {
  const records = new Map()

  const get = (key, create) => {
    if (!records.has(key)) {
      const record = { value: null, promise: null }
      record.promise = Promise.resolve()
        .then(create)
        .then(value => {
          record.value = value
          return value
        })
      records.set(key, record)
    }
    return records.get(key).promise
  }

  const getBytes = () =>
    [...records.values()].reduce(
      (total, record) => total + (record.value?.getGPUBytes?.() || 0),
      0
    )

  const destroy = () => {
    records.forEach(record => {
      if (record.value) record.value.destroy?.()
      else record.promise.then(value => value.destroy?.(), () => {})
    })
    records.clear()
  }

  return { get, getBytes, destroy }
}
