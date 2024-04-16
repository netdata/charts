import React, { forwardRef } from "react"
import { TextSmall } from "@netdata/netdata-ui"
import { useConvertedValue } from "@/components/provider"

export const Value = forwardRef((props, ref) => (
  <TextSmall color="textDescription" data-testid="chartDimensions-value" {...props} ref={ref} />
))

const ValueComponent = forwardRef(
  ({ id, visible, valueKey, period = "latest", objKey, Component = Value, ...rest }, ref) => {
    const value = useConvertedValue(id, period, { valueKey, objKey, allowNull: true })

    if (!visible) return null

    return (
      <Component {...rest} ref={ref}>
        {value}
      </Component>
    )
  }
)

export default ValueComponent
