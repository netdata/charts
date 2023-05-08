import React from "react"
import styled from "styled-components"
import { Flex, TextSmall, getColor } from "@netdata/netdata-ui"
import chevronExpand from "@netdata/netdata-ui/lib/components/icon/assets/chevron_expand.svg"
import { useChart, useAttributeValue } from "@/components/provider"
import Icon from "@/components/icon"

const Container = styled(Flex).attrs(props => ({
  "data-testid": "chartExpander",
  alignItems: "center",
  justifyContent: "center",
  gap: 1,
  ...props,
}))`
  &:hover > * {
    color: ${getColor("text")};
    fill: ${getColor("text")};
  }
`

const Expander = () => {
  const chart = useChart()
  const expanded = useAttributeValue("expanded")

  return (
    <Container
      cursor="pointer"
      onClick={() => chart.updateAttribute("expanded", !expanded)}
      alignSelf="center"
    >
      <Icon
        svg={chevronExpand}
        color="textLite"
        width="7.5px"
        height="5px"
        rotate={expanded ? 2 : 0}
      />
      <TextSmall color="textLite">{expanded ? "Collapse" : "Expand"}</TextSmall>
      <Icon
        svg={chevronExpand}
        color="textLite"
        width="7.5px"
        height="5px"
        rotate={expanded ? 2 : 0}
      />
    </Container>
  )
}

export default Expander
