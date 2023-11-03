import styled from "styled-components"
import { getColor, cursor } from "@netdata/netdata-ui"
import { withTooltip } from "@/components/tooltip"

const color = ({ active, disabled, defaultColor = "textLite" }) => {
  if (active) return "text"
  if (disabled) return "disabled"

  return defaultColor
}

const Button = styled.button.attrs(({ icon, hoverIndicator = true, padding = 0, ...rest }) => ({
  cursor: "pointer",
  ...rest,
  children: icon || rest.children,
  active: rest.active || rest["aria-expanded"],
  hoverIndicator,
  padding,
}))`
  border: initial;
  padding: ${({ padding }) => padding};
  height: auto;
  line-height: 0;
  background: ${({ theme, active }) =>
    active ? getColor("borderSecondary")({ theme }) : "initial"};
  ${cursor}
  color: ${({ active, disabled, theme }) => getColor(color({ active, disabled }))({ theme })};

  svg {
    fill: ${({ active, disabled, theme, stroked }) =>
      stroked ? "none" : getColor(color({ active, disabled }))({ theme })};
    stroke: ${({ active, disabled, theme, stroked }) =>
      stroked ? getColor(color({ active, disabled }))({ theme }) : "none"};
  }

  ${({ active, hoverIndicator }) =>
    (active || hoverIndicator) &&
    `
    border-radius: 4px;
  `}

  &:hover {
    ${({ theme, hoverIndicator, disabled }) =>
      hoverIndicator && !disabled && `background: ${getColor("mainChartTboxHover")({ theme })};`};

    color: ${({ active, disabled, theme }) => getColor(color({ active, disabled }))({ theme })};
    svg {
      fill: ${({ theme, stroked, disabled }) =>
        stroked ? "none" : getColor(color({ defaultColor: "text", disabled }))({ theme })};
      stroke: ${({ theme, stroked, disabled }) =>
        stroked ? getColor(color({ defaultColor: "text", disabled }))({ theme }) : "none"};
    }
  }
`

export default withTooltip(Button)
