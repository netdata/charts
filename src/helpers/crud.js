export const getValue = (path, defaultValue, obj = {}) => {
  if (typeof path !== 'string' || !path || obj == null) return defaultValue
  
  const keys = path.split('.')
  const [currentKey, ...remainingKeys] = keys
  
  if (remainingKeys.length === 0) {
    return obj[currentKey] !== undefined ? obj[currentKey] : defaultValue
  }
  
  const nextObj = obj[currentKey]
  if (nextObj == null || (typeof nextObj !== 'object' && !Array.isArray(nextObj))) {
    return defaultValue
  }
  
  return getValue(remainingKeys.join('.'), defaultValue, nextObj)
}

export const setValue = (path, value, obj = {}) => {
  if (typeof path !== 'string' || !path) return obj
  
  const keys = path.split('.')
  const [currentKey, ...remainingKeys] = keys
  
  if (remainingKeys.length === 0) {
    obj[currentKey] = value
    return obj
  }
  
  if (obj[currentKey] == null || typeof obj[currentKey] !== 'object') {
    obj[currentKey] = {}
  }
  
  return setValue(remainingKeys.join('.'), value, obj[currentKey])
}

export const deleteKey = (path, obj = {}) => {
  if (typeof path !== 'string' || !path) return obj
  
  const keys = path.split('.')
  const [currentKey, ...remainingKeys] = keys
  
  if (remainingKeys.length === 0) {
    delete obj[currentKey]
    return obj
  }
  
  const nextObj = obj[currentKey]
  if (nextObj != null && typeof nextObj === 'object' && !Array.isArray(nextObj)) {
    deleteKey(remainingKeys.join('.'), nextObj)
  }
  
  return obj
}

export const flattenObject = (obj, prefix = '') => {
  const result = {}
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key]
      const newKey = prefix ? `${prefix}.${key}` : key
      
      if (value != null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, flattenObject(value, newKey))
      } else {
        result[newKey] = value
      }
    }
  }
  
  return result
}