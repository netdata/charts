export const setsAreEqual = (a, b) => {
  if (a.size !== b.size) return false

  return Array.from(a).every(element => b.has(element))
}

export const filter = (arr, { omit = [], keep = [] }) => {
  if (!omit.length || !keep.length) return arr

  return arr.filter(element => {
    if (keep.length) return keep.includes(element)
    return !omit.includes(element)
  })
}

const deepEqual = (objA, objB, options = {}) => {
  if (objA === objB) return true

  if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
    return false
  }

  const keysA = filter(Object.keys(objA), options)
  const keysB = filter(Object.keys(objB), options)

  if (keysA.length !== keysB.length) return false

  const bHasOwnProperty = Object.prototype.hasOwnProperty.bind(objB)

  return !keysA.some(key => {
    if (!bHasOwnProperty(key)) return true
    if (objA[key] === objB[key]) return false

    return !deepEqual(objA[key], objB[key])
  })
}

export default deepEqual
