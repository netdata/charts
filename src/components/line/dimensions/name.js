import React, { memo, forwardRef } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import { useChart } from "@/components/provider"
import EllipsisInTheMiddle from "@/components/helpers/ellipsisInTheMiddle"

export const Name = memo(
  forwardRef(({ children, ...rest }, ref) => (
    <Flex ref={ref} data-testid="chartDimensions-name" overflow="hidden" {...rest}>
      <TextMicro color="textDescription" whiteSpace="nowrap">
        {children}
      </TextMicro>
    </Flex>
  ))
)

const Container = ({ id, maxLength = 15, ...rest }) => {
  const chart = useChart()
  const name = chart.getDimensionName(id)

  return <EllipsisInTheMiddle text={name} maxLength={maxLength} Component={Name} {...rest} />
}

export default Container
