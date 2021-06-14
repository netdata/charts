import React, { useEffect, useRef, useState } from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"

const DimensionValue = ({ chart, id, ...rest }) => {
  const getValue = () => {
    const hover = chart.getAttribute("hoverX")
    const { result } = chart.getPayload()
    const index = hover ? hover[0] : result.data.length - 1
    const value = chart.getDimensionValue(id, index)
    return chart.getConvertedValue(value)
  }

  const [value, setState] = useState(getValue)

  const unmount = useRef(false)

  useEffect(() => {
    const remove = chart.onAttributeChange("hoverX", () => {
      setState(getValue())
    })

    chart.on("successFetch", () => {
      setState(getValue())
    })

    chart.on("convertedValuesChange", () => {
      setState(getValue())
    })

    return () => {
      unmount.current = true
      remove()
    }
  }, [])

  return (
    <TextMicro strong {...rest}>
      {value}
    </TextMicro>
  )
}

export default DimensionValue
