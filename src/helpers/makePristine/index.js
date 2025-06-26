import deepEqual from "@/helpers/deepEqual"
import { getValue, setValue, deleteKey } from "@/helpers/crud"

const defaultDispatch = (value, resource) => Object.assign(resource, value)

export default (pristineKey, keys, dispatch = defaultDispatch) => {
  const keysSet = new Set(keys)

  const updatePristine = (resource, key, value) => {
    if (!keysSet.has(key)) return

    if (!resource[pristineKey]) return

    const currentValue = getValue(key, undefined, resource)
    const pristineValue = getValue(key, undefined, resource[pristineKey])

    if (pristineValue === undefined && !deepEqual(currentValue, value)) {
      const prev = resource[pristineKey]
      const newPristine = { ...resource[pristineKey] }
      setValue(key, currentValue, newPristine)
      dispatch({ [pristineKey]: newPristine }, resource)
      return prev
    }

    if (deepEqual(pristineValue, value)) {
      const prev = resource[pristineKey]
      const copy = { ...resource[pristineKey] }
      deleteKey(key, copy)
      dispatch({ [pristineKey]: copy }, resource)
      return prev
    }
  }

  const resetPristine = resource => {
    dispatch({ ...resource[pristineKey], [pristineKey]: {} }, resource)
  }

  return { updatePristine, resetPristine }
}
