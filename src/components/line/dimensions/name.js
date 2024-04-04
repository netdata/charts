import React, { memo, forwardRef } from "react"
import { TextMicro } from "@netdata/netdata-ui"
import { useChart } from "@/components/provider"
import Shortener from "@/components/helpers/shortener"

export const Name = memo(
  forwardRef(({ children, ...rest }, ref) => (
    <Shortener
      text={children}
      Component={TextMicro}
      color="textDescription"
      whiteSpace="nowrap"
      ref={ref}
      data-testid="chartDimensions-name"
      {...rest}
    />
  ))
)

const Container = ({ id, partIndex, ...rest }) => {
  const chart = useChart()
  const name = chart.getDimensionName(id, partIndex)

  return <Name {...rest}>{name}</Name>
}

export default Container
