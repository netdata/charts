import styled from "styled-components"
import { getColor } from "@netdata/netdata-ui/lib/theme/utils"

const color = (active, disabled) => {
  if (active) return "textDescription"
  if (disabled) return "disabled"

  return "border"
}

const Button = styled.button.attrs(({ icon }) => ({ children: icon }))`
  border: initial;
  padding: 0;
  line-height: 0;
  background: ${({ theme, active }) =>
    active ? getColor("borderSecondary")({ theme }) : "initial"};
  cursor: pointer;

  svg {
    fill: ${({ active, disabled, theme, stroked }) =>
      stroked ? "none" : getColor(color(active, disabled))({ theme })};
    stroke: ${({ active, disabled, theme, stroked }) =>
      stroked ? getColor(color(active, disabled))({ theme }) : "none"};
  }

  ${({ active }) =>
    active &&
    `
    border-radius: 4px;
  `}

  &:hover {
    svg {
      fill: ${({ theme, stroked }) => (stroked ? "none" : getColor("textDescription")({ theme }))};
      stroke: ${({ theme, stroked }) =>
        stroked ? getColor("textDescription")({ theme }) : "none"};
    }
  }
`

export default Button
