import { useState } from "react"
import useHover from "./useHover"

export default () => {
  const [focused, setFocused] = useState(false)
  const ref = useHover({ onHover: () => setFocused(true), onBlur: () => setFocused(false) })

  return [ref, focused]
}
