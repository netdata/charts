import React, { memo } from "react"
import styled from "styled-components"
import { useAttributeValue, useIsModern } from "@/components/provider"
import { radius } from "@/components/modern/tokens"
import { DropdownSelectionCheck, Menu, Text, TextMicro, Flex, getColor } from "@netdata/netdata-ui"
import information from "@netdata/netdata-ui/dist/components/icon/assets/information.svg"
import Icon from "@/components/icon"
import Tooltip from "@/components/tooltip"
import Label from "./label"
import ModernItem from "./modern/item"
import usePrefersReducedMotion from "@/components/helpers/usePrefersReducedMotion"
import { menuItemStates } from "@/components/modern/menu"

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
  ${menuItemStates()}
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
      aria-selected={justDesc ? undefined : selected}
      aria-disabled={selected || undefined}
      data-selected={selected || undefined}
      onClick={() => onItemClick(value)}
      justDesc={justDesc}
    >
      <Flex
        column={justDesc}
        padding={[0, 1]}
        alignItems="start"
        width="100%"
        justifyContent="between"
      >
        {!!label && <Text>{label}</Text>}
        {!!description &&
          (justDesc ? (
            <TextMicro color="textLite">{description}</TextMicro>
          ) : (
            <Tooltip content={description} zIndex={9999999}>
              <div>
                <Icon width="14px" height="14px" color="textLite" svg={information} />
              </div>
            </Tooltip>
          ))}
      </Flex>
      {selected && !justDesc && <DropdownSelectionCheck />}
    </ItemContainer>
  )
}

const defaultDropdownProps = { padding: [0, 0, 2, 0], height: { max: "60vh" } }

const modernDropdownProps = {
  padding: [1, 0],
  height: { max: "60vh" },
  round: radius.card,
  border: { side: "all", color: "border" },
  "data-testid": "modern-filter-single-select",
}

const DropdownSingleSelect = ({ labelProps, ...rest }) => {
  const id = useAttributeValue("id")
  const isModern = useIsModern()
  const reducedMotion = usePrefersReducedMotion()

  return (
    <Menu
      {...rest}
      animation={isModern && !reducedMotion}
      Item={isModern ? ModernItem : Item}
      dropProps={{
        align: { top: "bottom", left: "left" },
        "data-toolbox": id,
        width: "460px",
        zIndex: 100,
      }}
      dropdownProps={isModern ? modernDropdownProps : defaultDropdownProps}
      {...rest}
    >
      <Label {...labelProps} data-value={`${rest.value || "No selection"}`} />
    </Menu>
  )
}

export default memo(DropdownSingleSelect)
