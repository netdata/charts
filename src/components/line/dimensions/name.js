import React, { memo, forwardRef } from "react"
import { TextSmall } from "@netdata/netdata-ui"
import { useChart } from "@/components/provider"
import Shortener from "@/components/helpers/shortener"

export const Name = memo(
  forwardRef(({ children, isEmpty, ...rest }, ref) => (
    <Shortener
      text={children}
      Component={TextSmall}
      color={isEmpty ? "textNoFocus" : "text"}
      whiteSpace="nowrap"
      ref={ref}
      data-testid="chartDimensions-name"
      {...rest}
    />
  ))
)

const Container = ({ id, partIndex, fallback = "", ...rest }) => {
  const chart = useChart()
  const name = chart.getDimensionName(id, partIndex)

  return (
    <Name {...rest} isEmpty={!name}>
      {name || fallback}
    </Name>
  )
}

export default Container
