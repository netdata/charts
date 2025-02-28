import React from "react"
import noop from "lodash/noop"
import styled from "styled-components"
import {
  Flex,
  MenuDropdown as Checkboxes,
  TextSmall,
  Icon,
  Checkbox,
  getRgbColor,
  getColor,
  Pill,
} from "@netdata/netdata-ui"
import Shortener from "@/components/helpers/shortener"

const capitalize = s => (s ? s[0].toUpperCase() + s.slice(1) : "Unknown")

const defaultItemsProps = {
  head: { textColor: "textLite" },
  row: { textColor: "text" },
}
const getBackground = ({ theme }) => {
  const { name } = theme

  const background =
    name === "Dark" ? getRgbColor(["green", "green20"]) : getRgbColor(["green", "green170"])

  return background({ theme })
}

export const ItemContainer = styled(Flex).attrs(props => ({
  as: "li",
  role: "option",
  padding: [1, 2],
  gap: 1,
  justifyContent: "between",
  width: "100%",
  ...props,
}))`
  cursor: ${({ disabled }) => (disabled ? "default" : "pointer")};
  opacity: ${({ stale, disabled, selected }) => ((stale || disabled) && !selected ? 0.6 : 1)};
  align-items: ${({ alignItems }) => alignItems || "center"};
  ${({ multi, selected, theme }) =>
    !multi &&
    selected &&
    `
    background-color: ${getBackground({ theme })};
  `}
  ${({ multi, selected, disabled, theme }) =>
    !multi &&
    !selected &&
    !disabled &&
    `
    &:hover {
      background-color: ${getColor("secondaryHighlight")({ theme })};
    }
  `}
`

const DefaultItem = ({ item, onItemClick, itemProps, ...rest }) => {
  const {
    value,
    disabled,
    onClick,
    label,
    selected,
    excluded,
    indeterminate,
    textColor,
    iconName,
    count,
    actualCount,
    pill,
    level = 0,
    stale,
    ...restItem
  } = item
  const { capitalized } = itemProps

  const { multi } = itemProps

  const isDisabled = disabled || (!multi && selected)

  const onSelect = event => {
    if (disabled) return
    if (onClick) onClick(event)
    onItemClick({ value, label, checked: !selected, item })
  }

  return (
    <ItemContainer
      aria-selected={selected}
      selected={selected}
      disabled={isDisabled}
      stale={count === 0 || count === "0" || stale || excluded}
      {...restItem}
      {...rest}
      {...itemProps}
      data-testid={`${itemProps.testIdPrefix}-filters-item`}
    >
      <Flex
        gap={2}
        alignItems="center"
        padding={[0, 0, 0, level * 4]}
        width="100%"
        overflow="hidden"
      >
        {multi ? (
          <Checkbox
            data-testid={`${itemProps.testIdPrefix}-filters-checkbox-${label}`}
            checked={selected}
            disabled={isDisabled}
            indeterminate={indeterminate}
            onChange={onSelect}
            label={
              <Flex gap={1} alignItems="center" width="100%">
                {iconName && <Icon name={iconName} size="small" color="textLite" />}
                <Shortener
                  Component={TextSmall}
                  text={
                    typeof label === "string" && capitalized ? capitalize(label) : label.toString()
                  }
                  color={textColor}
                />
              </Flex>
            }
          />
        ) : (
          <Flex
            flex
            gap={1}
            padding={[0, 1]}
            alignItems="center"
            onClick={selected ? noop : onSelect}
            data-testid={`${itemProps.testIdPrefix}-filters-item-${label}`}
          >
            <Shortener
              Component={TextSmall}
              text={typeof label === "string" && capitalized ? capitalize(label) : label.toString()}
              color={textColor}
            />
          </Flex>
        )}
      </Flex>
      {(!isNaN(count) || /%/.test(count || "") || pill) && (
        <Pill
          flavour="neutral"
          hollow
          data-testid={`${itemProps.testIdPrefix}-filters-${label}-count`}
          size="small"
        >
          {!!actualCount && <TextSmall>{actualCount} &#8835;&nbsp;</TextSmall>}
          {(pill || count).toString()}
        </Pill>
      )}
    </ItemContainer>
  )
}

export const CheckboxesContainer = styled(Checkboxes).attrs(props => ({
  background: "transparent",
  hideShadow: true,
  height: { max: "300px" },
  width: { max: "600px" },
  overflow: "auto",
  ...props,
}))`
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
`

const identity = i => i

export const checkboxesDefaultProps = {
  itemProps: { padding: [1, 0.5], multi: true },
  itemsProps: defaultItemsProps,
  Item: DefaultItem,
  getValue: identity,
  getLabel: identity,
}
