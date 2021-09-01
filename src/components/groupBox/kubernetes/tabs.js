import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Button } from "@netdata/netdata-ui/lib/components/button"
import { getColor } from "@netdata/netdata-ui/lib/theme/utils"
import styled from "styled-components"

export const TabButton = styled(Button).attrs(({ active }) => ({
  flavour: "borderless",
  neutral: true,
  themeType: "dark",
  className: "btn",
  disabled: active,
  "data-testid": "k8sPopoverChart-tab",
}))`
  &&& {
    height: initial;
    width: initial;
    padding: 2px 20px;
    ${({ active, theme }) => active && `border-bottom: 3px solid ${getColor("bright")({ theme })};`}
    color: ${({ active, theme }) => getColor(active ? "bright" : "separator")({ theme })}
  }
`

const Tabs = ({ value, onChange, ...rest }) => (
  <Flex data-testid="k8sPopoverChart-tabs" {...rest}>
    <TabButton label="Context" active={value === "context"} onClick={() => onChange("context")} />
    <TabButton label="Metrics" active={value === "metrics"} onClick={() => onChange("metrics")} />
  </Flex>
)

export default Tabs
