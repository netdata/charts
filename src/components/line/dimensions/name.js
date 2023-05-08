import React, { memo, forwardRef } from "react"
import { TextMicro } from "@netdata/netdata-ui"
import { useChart } from "@/components/provider"
import Shortener from "@/components/helpers/shortener"

export const Name = memo(
  forwardRef(({ children, maxLength = 32, ...rest }, ref) => (
    <Shortener
      text={children}
      maxLength={maxLength}
      Component={TextMicro}
      color="textDescription"
      whiteSpace="nowrap"
      ref={ref}
      data-testid="chartDimensions-name"
      {...rest}
    />
  ))
)

const Container = ({ id, ...rest }) => {
  const chart = useChart()
  const name = chart.getDimensionName(id)

  return <Name {...rest}>{name}</Name>
}

export default Container
