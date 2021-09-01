import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import makeFlex from "@netdata/netdata-ui/lib/components/templates/flex/flex"
import { H6 } from "@netdata/netdata-ui/lib/components/typography"
import { Button } from "@netdata/netdata-ui/lib/components/button"

const ExpandButton = styled(makeFlex(Button)).attrs({
  icon: "chevron_right_s",
  label: "More",
  flavour: "borderless",
  neutral: true,
  themeType: "dark",
  className: "btn",
  alignItems: "baseline",
  gap: 1,
  direction: "rowReverse",
})`
  &&& {
    padding: 0;
    margin: 0;
    font-weight: normal;
    height: initial;
    width: initial;

    svg {
      height: 6px;
      width: 6px;
      position: initial;
    }
  }
`

const Section = ({ title, onExpand, children, noBorder }) => (
  <Flex
    gap={3}
    padding={[0, 0, 3]}
    border={!noBorder && { side: "bottom", color: "separator" }}
    column
    data-testid="k8sPopoverSection"
  >
    <Flex justifyContent="between" data-testid="k8sPopoverSection-header">
      <H6 color="border" wordBreak="break-all">
        {title}
      </H6>
      {onExpand && <ExpandButton onClick={onExpand} />}
    </Flex>
    <Flex gap={4} column data-testid="k8sPopoverSection-content">
      {children}
    </Flex>
  </Flex>
)

export default Section
