import React, { memo, forwardRef } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import { useChart } from "@/components/provider"
import EllipsisInTheMiddle from "@/components/helpers/ellipsisInTheMiddle"

export const Name = memo(
  forwardRef(({ children, maxLength = 15, ...rest }, ref) => (
    <Flex ref={ref} data-testid="chartDimensions-name" overflow="hidden" {...rest}>
      <EllipsisInTheMiddle
        text={children}
        maxLength={maxLength}
        Component={TextMicro}
        color="textDescription"
        whiteSpace="nowrap"
      />
    </Flex>
  ))
)

const Container = ({ id, ...rest }) => {
  const chart = useChart()
  const name = chart.getDimensionName(id)

  return <Name {...rest}>{name}</Name>
}

export default Container
