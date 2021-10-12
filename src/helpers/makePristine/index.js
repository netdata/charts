import deepEqual from "@/helpers/deepEqual"

const defaultDispatch = (value, resource) => Object.assign(resource, value)

export default (pristineKey, keys, dispatch = defaultDispatch) => {
  const keysSet = new Set(keys)

  const updatePristine = (resource, key, value) => {
    if (!keysSet.has(key)) return

    if (!(key in resource[pristineKey]) && !deepEqual(resource[key], value)) {
      const prev = resource[pristineKey]
      dispatch({ [pristineKey]: { ...resource[pristineKey], [key]: resource[key] } }, resource)
      return prev
    }

    if (deepEqual(resource[pristineKey][key], value)) {
      const prev = resource[pristineKey]
      const copy = { ...resource[pristineKey] }
      delete copy[key]
      dispatch({ [pristineKey]: copy }, resource)
      return prev
    }
  }

  const resetPristine = resource => {
    dispatch({ ...resource[pristineKey], [pristineKey]: {} }, resource)
  }

  return { updatePristine, resetPristine }
}
