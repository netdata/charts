export default () => {
  const ids = new Set()

  return {
    addSync: callback => (...args) => callback(...args),
    add: callback => {
      let id
      return (...args) => {
        ids.delete(id)
        clearTimeout(id)

        id = setTimeout(() => callback(...args), 0)
        ids.add(id)
      }
    },
    clear: () => Array.from(ids).forEach(id => clearTimeout(id)),
  }
}
