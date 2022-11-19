import { filter } from "@/helpers/deepEqual"

const deepMergeArray = (arrA, arrB, options) => {
  const filteredB = filter(arrA, options)

  return filteredB.reduce((h, element, index) => {
    h.push(deepMerge(element, filteredB[index]))
    return h
  }, [])
}

const deepMergeObject = (objA, objB, options) => {
  const keysB = filter(Object.keys(objB), options)

  const aHasOwnProperty = Object.prototype.hasOwnProperty.bind(objA)

  keysB.reduce((h, key) => {
    if (!aHasOwnProperty(key)) {
      h[key] = objB[key]
    } else {
      h[key] = deepMerge(objA[key], objB[key])
    }

    return h
  }, {})
}

const deepMerge = (objA, objB, options = {}) => {
  if (objA === objB) return objB

  if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null)
    return objB

  return Array.isArray(objB)
    ? deepMergeArray(objA, objB, options)
    : deepMergeObject(objA, objB, options)
}

export default deepMerge
