export const setsAreEqual = (a, b) => {
  if (a.size !== b.size) return false

  return Array.from(a).every(element => b.has(element))
}

const deepEqual = (objA, objB) => {
  if (objA === objB) return true

  if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
    return false
  }

  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) return false

  const bHasOwnProperty = Object.prototype.hasOwnProperty.bind(objB)

  return !keysA.some(key => {
    if (!bHasOwnProperty(key)) return true
    if (objA[key] === objB[key]) return false

    return !deepEqual(objA[key], objB[key])
  })
}

export default deepEqual
