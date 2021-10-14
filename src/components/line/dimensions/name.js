import React, { memo, forwardRef } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import { useChart } from "@/components/provider"
import { withTooltip } from "@/components/tooltip"

const NamePart = styled(TextMicro).attrs(props => ({
  truncate: true,
  color: "textDescription",
  whiteSpace: "nowrap",
  ...props,
}))`
  ${props =>
    props.rtl
      ? `
    direction: rtl;
    margin-left: -20px;
    `
      : ""}
}
`

const Mid = styled.div`
  width: 20px;
  flex-shrink: 10;
`

export const Name = memo(
  withTooltip(
    forwardRef(({ children, ...rest }, ref) => (
      <Flex ref={ref} data-testid="chartDimensions-name" overflow="hidden" {...rest}>
        <NamePart>{children.substring(0, children.length / 2)}</NamePart>
        <Mid />
        <NamePart rtl>{children.substring(children.length / 2)}</NamePart>
      </Flex>
    ))
  )
)

const Container = ({ id, ...rest }) => {
  const chart = useChart()
  const name = chart.getDimensionName(id)

  return (
    <Name title={name.length > 10 ? name : null} {...rest}>
      {name}
    </Name>
  )
}

export default Container
