import React from "react"
import styled from "styled-components"
import { Flex, TextSmall, TextMicro, getColor } from "@netdata/netdata-ui"
import checkmark_s from "@netdata/netdata-ui/dist/components/icon/assets/checkmark_s.svg"
import information from "@netdata/netdata-ui/dist/components/icon/assets/information.svg"
import Icon from "@/components/icon"
import Tooltip from "@/components/tooltip"
import { radius } from "@/components/modern/tokens"

const ItemContainer = styled(Flex).attrs(props => ({
  as: "li",
  role: "option",
  padding: [1, 2],
  margin: [0, 1],
  gap: 1,
  alignItems: "center",
  justifyContent: "between",
  ...props,
}))`
  border-radius: ${radius.control};
  cursor: ${({ disabled }) => (disabled ? "default" : "pointer")};
  ${({ selected, theme }) =>
    selected && `background-color: ${getColor("elementBackground")({ theme })};`}
  ${({ selected, theme }) =>
    !selected && `&:hover { background-color: ${getColor("borderSecondary")({ theme })}; }`}
  ${({ justDesc, theme }) =>
    justDesc &&
    `
    pointer-events: none;
    border-radius: 0;
    border-top: 1px solid ${getColor("borderSecondary")({ theme })};
  `}
`

const ModernItem = ({ value: selectedValue, item, onItemClick, itemProps }) => {
  const { value, label, description, justDesc = false } = item
  const selected = selectedValue === value

  if (justDesc)
    return (
      <ItemContainer {...itemProps} justDesc data-testid="modern-filter-item-description">
        <TextMicro color="textLite">{description}</TextMicro>
      </ItemContainer>
    )

  return (
    <ItemContainer
      {...itemProps}
      disabled={selected}
      selected={selected}
      aria-selected={selected}
      onClick={() => onItemClick(value)}
      data-testid="modern-filter-item"
    >
      <Flex gap={1} alignItems="center">
        <TextSmall color={selected ? "text" : "textDescription"} strong={selected}>
          {label}
        </TextSmall>
        {!!description && (
          <Tooltip content={description} zIndex={9999999}>
            <div>
              <Icon width="12px" height="12px" color="textLite" svg={information} />
            </div>
          </Tooltip>
        )}
      </Flex>
      {selected && <Icon width="14px" height="14px" color="text" svg={checkmark_s} />}
    </ItemContainer>
  )
}

export default ModernItem
