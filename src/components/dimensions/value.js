import React, { useEffect, useRef, useState } from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import { useChart } from "@/components/provider"
import { unregister } from "@/helpers/makeListeners"

export const Value = props => (
  <TextMicro color="textDescription" data-testid="chartDimensions-value" {...props} />
)

const Container = ({ id, ...rest }) => {
  const chart = useChart()

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
    const off = unregister(
      chart.onAttributeChange("hoverX", () => setState(getValue())),
      chart.on("dimensionChanged", () => setState(getValue())),
      chart.getUI().on("rendered", () => setState(getValue()))
    )

    return () => {
      unmount.current = true
      off()
    }
  }, [chart])

  return <Value {...rest}>{value}</Value>
}

export default Container
