import React, { useEffect, useRef, useState } from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"

const DimensionValue = ({ chart, index, ...rest }) => {
  const getValue = () => {
    const hover = chart.getAttribute("hover")
    const { result } = chart.getPayload()
    const x = hover ? hover[0] : result.data.length - 1
    return result.data[x][index + 1]
  }

  const [value, setState] = useState(getValue)

  const unmount = useRef(false)

  useEffect(() => {
    const remove = chart.onAttributeChange("hover", () => {
      setState(getValue())
    })

    return () => {
      unmount.current = true
      remove()
    }
  }, [])

  return <TextMicro {...rest}>{value}</TextMicro>
}

export default DimensionValue
