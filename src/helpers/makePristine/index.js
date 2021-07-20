import deepEqual from "@/helpers/deepEqual"

export default (pristineKey, keys) => {
  const keysSet = new Set(keys)

  const updatePristine = (resource, key, value) => {
    if (!keysSet.has(key)) return

    if (!(key in resource[pristineKey]) && !deepEqual(resource[key], value)) {
      const prev = resource[pristineKey]
      resource[pristineKey] = { ...resource[pristineKey], [key]: resource[key] }
      return prev
    }

    if (deepEqual(resource[pristineKey][key], value)) {
      const prev = resource[pristineKey]
      const copy = { ...resource[pristineKey] }
      delete copy[key]
      resource[pristineKey] = copy
      return prev
    }
  }

  const resetPristine = resource => {
    Object.assign(resource, { ...resource[pristineKey], [pristineKey]: {} })
  }

  return { updatePristine, resetPristine }
}
