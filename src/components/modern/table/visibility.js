import { useCallback, useState } from "react"
import { getMergedLabelVisibility } from "./columns"

const emptyVisibility = {}

const getMergedKey = columns => Object.keys(getMergedLabelVisibility(columns) || {}).join("|")

const fromKey = key =>
  key
    ? key.split("|").reduce((visibility, id) => {
        visibility[id] = false
        return visibility
      }, {})
    : emptyVisibility

export const useModernColumnVisibility = (columns, enabled = true) => {
  const key = enabled ? getMergedKey(columns) : ""
  const [state, setState] = useState(() => ({ key, visibility: fromKey(key) }))
  const current = state.key === key ? state : { key, visibility: fromKey(key) }

  if (current !== state) setState(current)

  const setVisibility = useCallback(
    value =>
      setState(prev => ({
        key: prev.key,
        visibility: typeof value === "function" ? value(prev.visibility) : value,
      })),
    []
  )

  return [current.visibility, setVisibility]
}

export default useModernColumnVisibility
