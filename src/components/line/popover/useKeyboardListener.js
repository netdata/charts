import { useCallback, useEffect } from "react"

const digitRegexp = new RegExp(/^Digit\d+$/)

const useKeyboardListener = ({ chart, ids }) => {
  const keyDownHandler = useCallback(
    e => {
      const isDigit = digitRegexp.test(e.code)
      if (!isDigit) return
      const digit = e.code.replace(/^Digit/, "")
      if (digit === null || isNaN(digit)) return
      const id = ids[parseInt(digit) - 1]
      if (!id) return
      const merge = e.shiftKey || e.ctrlKey || e.metaKey
      chart.toggleDimensionId(id, { merge })
    },
    [chart, ids]
  )

  useEffect(() => {
    window.addEventListener("keydown", keyDownHandler)
    return () => {
      window.removeEventListener("keydown", keyDownHandler)
    }
  }, [chart, ids])
}

export default useKeyboardListener
