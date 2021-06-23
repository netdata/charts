import React from "react"
import styled from "styled-components"
import { getColor } from "@netdata/netdata-ui/lib/theme/utils"

const color = (active, disabled) => {
  if (active) return "separator"
  if (disabled) return "disabled"

  return "border"
}

const Button = styled.button.attrs(({ icon }) => ({ children: icon }))`
  border: initial;
  padding: 2px 4px;
  background: ${({ active }) => (active ? "#ECEEEF" : "initial")};
  cursor: pointer;

  svg {
    fill: ${({ active, disabled, theme }) => getColor(color(active, disabled))({ theme })};
  }

  ${({ active }) =>
    active &&
    `
    border-radius: 16px;
  `}

  &:hover {
    svg {
      fill: ${getColor("separator")};
    }
  }
`

export default Button
