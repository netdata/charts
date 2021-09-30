import styled from "styled-components"
import { getColor } from "@netdata/netdata-ui/lib/theme/utils"
import { withTooltip } from "@/components/tooltip"

const color = ({ active, disabled, defaultColor = "border" }) => {
  if (active) return "textDescription"
  if (disabled) return "disabled"

  return defaultColor
}

const Button = styled.button.attrs(({ icon, hoverIndicator = true, ...rest }) => ({
  ...rest,
  children: icon,
  active: rest.active || rest["aria-expanded"],
  hoverIndicator,
}))`
  border: initial;
  padding: 0;
  line-height: 0;
  background: ${({ theme, active }) =>
    active ? getColor("borderSecondary")({ theme }) : "initial"};
  cursor: pointer;

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
      hoverIndicator && !disabled && `background: ${getColor("borderSecondary")({ theme })};`};

    svg {
      fill: ${({ theme, stroked, disabled }) =>
        stroked
          ? "none"
          : getColor(color({ defaultColor: "textDescription", disabled }))({ theme })};
      stroke: ${({ theme, stroked, disabled }) =>
        stroked
          ? getColor(color({ defaultColor: "textDescription", disabled }))({ theme })
          : "none"};
    }
  }
`

export default withTooltip(Button)
