import React from "react"
import noop from "lodash/noop"
import styled from "styled-components"
import { Flex, TextSmall, Icon, Checkbox } from "@netdata/netdata-ui"
import { SmallNumeral } from "@/components/modern/numerals"
import { radius } from "@/components/modern/tokens"

const capitalize = s => (s ? s[0].toUpperCase() + s.slice(1) : "Unknown")

export const modernItemsProps = {
  head: { textColor: "textDescription" },
  row: { textColor: "text" },
}

export const ItemContainer = styled(Flex).attrs(({ disabled, stale, selected, ...props }) => ({
  as: "li",
  role: "option",
  padding: [1, 2],
  gap: 2,
  alignItems: "center",
  justifyContent: "between",
  width: "100%",
  round: radius.control,
  cursor: disabled ? "default" : "pointer",
  opacity: (stale || disabled) && !selected ? 0.6 : 1,
  _hover: { background: "mainChartTboxHover" },
  ...props,
}))`
  [data-testid="styled-checkbox"] {
    background-color: transparent;
  }
`

const ModernCheckboxItem = ({ item, onItemClick, itemProps, ...rest }) => {
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
  const { capitalized, multi, testIdPrefix, ...restItemProps } = itemProps

  const isDisabled = disabled || (!multi && selected)
  const text = typeof label === "string" && capitalized ? capitalize(label) : label.toString()

  const onSelect = event => {
    if (disabled) return
    if (onClick) onClick(event)
    onItemClick({ value, label, checked: !selected, item })
  }

  const name = (
    <TextSmall color={textColor} title={text} whiteSpace="nowrap" truncate>
      {text}
    </TextSmall>
  )

  return (
    <ItemContainer
      aria-selected={selected}
      selected={selected}
      disabled={isDisabled}
      stale={count === 0 || count === "0" || stale || excluded}
      {...restItem}
      {...rest}
      {...restItemProps}
      data-testid={`${testIdPrefix}-filters-item`}
    >
      <Flex
        gap={2}
        alignItems="center"
        padding={[0, 0, 0, level * 4]}
        width={{ min: "0px" }}
        flex
        overflow="hidden"
      >
        {multi ? (
          <Checkbox
            data-testid={`${testIdPrefix}-filters-checkbox-${label}`}
            checked={selected}
            disabled={isDisabled}
            indeterminate={indeterminate}
            onChange={onSelect}
            overflow="hidden"
            label={
              <Flex gap={1} alignItems="center" overflow="hidden">
                {iconName && <Icon name={iconName} size="small" color="textLite" />}
                {name}
              </Flex>
            }
            labelProps={{ overflow: "hidden" }}
          />
        ) : (
          <Flex
            flex
            gap={1}
            alignItems="center"
            overflow="hidden"
            onClick={selected ? noop : onSelect}
            data-testid={`${testIdPrefix}-filters-item-${label}`}
          >
            {name}
          </Flex>
        )}
      </Flex>
      {(!isNaN(count) || /%/.test(count || "") || pill) && (
        <Flex flex={false} gap={1} data-testid={`${testIdPrefix}-filters-${label}-count`}>
          {!!actualCount && (
            <SmallNumeral color="textLite" whiteSpace="nowrap">{`${actualCount} ⊃`}</SmallNumeral>
          )}
          <SmallNumeral color="textLite" whiteSpace="nowrap">
            {(pill || count).toString()}
          </SmallNumeral>
        </Flex>
      )}
    </ItemContainer>
  )
}

export default ModernCheckboxItem
