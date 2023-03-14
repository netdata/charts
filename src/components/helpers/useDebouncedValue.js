import { useEffect, useState } from "react"
import { debounce } from "throttle-debounce"

export default (value, millis) => {
  const [state, setState] = useState(null)

  useEffect(() => {
    const debounceFunc = debounce(millis, () => setState(value))
    debounceFunc()

    return debounceFunc.cancel
  }, [value, millis])

  return state
}
