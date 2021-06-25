import React, { useEffect, useRef, useState } from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"

const Value = ({ chart, id, ...rest }) => {
  const getValue = () => {
    const hover = chart.getAttribute("hoverX")
    const { result } = chart.getPayload()

    const index = hover && hover[0] < result.data.length ? hover[0] : result.data.length - 1
    const value = chart.getDimensionValue(id, index)
    return chart.getConvertedValue(value)
  }

  const [value, setState] = useState(getValue)

  const unmount = useRef(false)

  useEffect(() => {
    const remove = chart.onAttributeChange("hoverX", () => {
      setState(getValue())
    })

    const off = chart.on("dimensionChanged", () => {
      setState(getValue())
    })

    return () => {
      unmount.current = true
      remove()
      off()
    }
  }, [])

  return (
    <TextMicro data-testid="chartDimensions-value" {...rest}>
      {value}
    </TextMicro>
  )
}

export default Value
