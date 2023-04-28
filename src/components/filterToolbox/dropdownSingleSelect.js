import React, { memo } from "react"
import styled from "styled-components"
import { Menu, Text, TextSmall, Flex, getColor, getRgbColor } from "@netdata/netdata-ui"
import checkmark_s from "@netdata/netdata-ui/lib/components/icon/assets/checkmark_s.svg"
import Icon from "@/components/icon"
import Label from "./label"

const getBackground = ({ theme }) => {
  const { name } = theme

  const background =
    name === "Dark" ? getRgbColor(["green", "netdata"], 0.3) : getRgbColor(["green", "frostee"])

  return background({ theme })
}

export const ItemContainer = styled(Flex).attrs(props => ({
  as: "li",
  role: "option",
  padding: [1, 2],
  gap: 1,
  justifyContent: "between",
  ...props,
}))`
  cursor: ${({ disabled }) => (disabled ? "default" : "pointer")};
  opacity: ${({ disabled, stale, selected }) => (!selected && (stale || disabled) ? 0.7 : 1)};
  align-items: ${({ alignItems }) => alignItems || "center"};
  ${({ selected, theme }) =>
    selected &&
    `
    background-color: ${getBackground({ theme })};
  `}
  ${({ selected, theme }) =>
    !selected &&
    `
    &:hover {
      background-color: ${getColor("borderSecondary")({ theme })};
    }
  `}
  ${({ justDesc, theme }) =>
    justDesc &&
    `
    pointer-events: none;
    border-top: 1px solid ${getColor("borderSecondary")({ theme })};
  `}
`

export const Item = ({ value: selectedValue, item, onItemClick, itemProps }) => {
  const { value, label, description, justDesc = false } = item
  const selected = selectedValue === value

  return (
    <ItemContainer
      {...itemProps}
      disabled={selected}
      selected={selected}
      onClick={() => onItemClick(value)}
      justDesc={justDesc}
    >
      <Flex column padding={[0, 1]} alignItems="start" width="100%">
        {!!label && (
          <Text>
            {label}
            {selected && (
              <Icon
                margin={[-0.5, 2, -0.5, 0]}
                width="14px"
                height="14px"
                color="primary"
                svg={checkmark_s}
              />
            )}
          </Text>
        )}
        {!!description && (
          <TextSmall strong={justDesc} color="textLite">
            {description}
          </TextSmall>
        )}
      </Flex>
    </ItemContainer>
  )
}

const DropdownSingleSelect = ({ labelProps, ...rest }) => (
  <Menu
    {...rest}
    Item={Item}
    dropProps={{
      align: { top: "bottom", left: "left" },
      "data-toolbox": true,
      width: "460px",
    }}
    dropdownProps={{ padding: [0, 0, 2, 0], height: { max: "80vh" } }}
    {...rest}
  >
    <Label {...labelProps} data-value={`${rest.value || "No selection"}`} />
  </Menu>
)

export default memo(DropdownSingleSelect)
