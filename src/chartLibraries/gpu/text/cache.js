export default limit => {
  const values = new Map()

  const get = key => values.get(key)
  const set = (key, value) => values.set(key, value)
  const clear = () => values.clear()
  const isFullFor = key => !values.has(key) && values.size >= limit

  return {
    get,
    set,
    clear,
    isFullFor,
    get size() {
      return values.size
    },
  }
}
