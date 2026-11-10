import styled from "styled-components"
import { DropdownSelectionCheck, Flex, TextSmall, TextMicro, getColor } from "@netdata/netdata-ui"
import information from "@netdata/netdata-ui/dist/components/icon/assets/information.svg"
import Icon from "@/components/icon"
import Tooltip from "@/components/tooltip"
import { radius } from "@/components/modern/tokens"
import { menuItemStates } from "@/components/modern/menu"

const ItemContainer = styled(Flex).attrs(props => ({
  as: "li",
  role: "option",
  color: "text",
  padding: [1, 2],
  margin: [0, 1],
  gap: 1,
  alignItems: "center",
  justifyContent: "between",
  ...props,
}))`
  border-radius: ${radius.control};
  cursor: pointer;
  ${menuItemStates()}

  &[data-selected="true"] {
    cursor: default;
  }

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
      data-selected={selected || undefined}
      aria-selected={selected}
      onClick={() => onItemClick(value)}
      data-testid="modern-filter-item"
    >
      <Flex gap={1} alignItems="center">
        <TextSmall color="inherit" strong={selected}>
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
      {selected && <DropdownSelectionCheck />}
    </ItemContainer>
  )
}

export default ModernItem
