export const camelToUnderscore = key => key.replace(/([A-Z])/g, "_$1").toLowerCase()
export const underscoreToCamel = key => key.replace(/([_][a-z])/g, g => g[1].toUpperCase())

const defaultOmit = []

const underscoredKey = (target, key, value) => ({
  ...target,
  [camelToUnderscore(key)]: value,
})

const camelizeKey = (target, key, value) => ({
  ...target,
  [underscoreToCamel(key)]: value,
})

export const objectTransformator = (data, { func, action, omit = defaultOmit }) => {
  if (Array.isArray(data)) {
    return data.map(v => func(v, { omit }))
  }

  if (typeof data === "object" && data) {
    return Object.keys(data).reduce((d, key) => {
      if (omit.includes(key)) {
        return { ...d, [key]: data[key] }
      }

      const value = func(data[key], { omit })
      return action(d, key, value)
    }, {})
  }

  return data
}

export const underscoredKeys = (data, { omit = defaultOmit }) =>
  objectTransformator(data, {
    func: underscoredKeys,
    action: underscoredKey,
    omit,
  })

export const camelizeKeys = (data, { omit = defaultOmit }) =>
  objectTransformator(data, {
    func: camelizeKeys,
    action: camelizeKey,
    omit,
  })
