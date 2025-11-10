const matchesPattern = (value, pattern) => {
  const hasStartWildcard = pattern.startsWith("*")
  const hasEndWildcard = pattern.endsWith("*")

  if (hasStartWildcard && hasEndWildcard) {
    const substring = pattern.slice(1, -1)
    return value.includes(substring)
  }

  if (hasStartWildcard) {
    const suffix = pattern.slice(1)
    return value.endsWith(suffix)
  }

  if (hasEndWildcard) {
    const prefix = pattern.slice(0, -1)
    return value.startsWith(prefix)
  }

  if (!pattern.includes("@")) {
    return value === pattern || value.startsWith(`${pattern}@`)
  }

  return value === pattern
}

const normalizeSelectedInstances = (selectedInstances, instances) => {
  if (!Array.isArray(selectedInstances) || !selectedInstances.length) {
    return selectedInstances
  }

  if (!instances || typeof instances !== "object") {
    return selectedInstances
  }

  const instanceKeys = Object.keys(instances)
  const normalizedSet = new Set()

  selectedInstances.forEach(selection => {
    if (!selection || typeof selection !== "string") return

    if (instances[selection]) {
      normalizedSet.add(selection)
      return
    }

    const matchedKeys = instanceKeys.filter(key => {
      const instance = instances[key]
      if (!instance) return false

      return matchesPattern(key, selection) ||
        matchesPattern(instance.id, selection) ||
        matchesPattern(instance.nm, selection)
    })

    matchedKeys.forEach(key => normalizedSet.add(key))
  })

  return Array.from(normalizedSet)
}

export default normalizeSelectedInstances
