import React, { useEffect, useRef, useState } from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"

export const Value = props => (
  <TextMicro color="textDescription" data-testid="chartDimensions-value" {...props} />
)

const Container = ({ chart, id, ...rest }) => {
  const getValue = () => {
    const hover = chart.getAttribute("hoverX")
    const { result } = chart.getPayload()

    let index = hover ? chart.getClosestRow(hover[0]) : -1
    index = index === -1 ? result.data.length - 1 : index

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

  return <Value {...rest}>{value}</Value>
}

export default Container
