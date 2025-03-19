import React from "react"
import { TextSmall, Flex, Button, Pill } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"

const FilterGroup = ({
  setSelected,
  testIdPrefix,
  param,
  children,
  border = { side: "left", color: "borderSecondary" },
  title = "Filters",
  ...rest
}) => {
  const selected = useAttributeValue(param)

  return (
    <Flex
      data-testid={`${testIdPrefix}-filter`}
      column
      padding={[2, 2, 0]}
      border={border}
      {...rest}
    >
      <Flex justifyContent="between" gap={2} cursor="pointer">
        <Flex alignItems="center" gap={1}>
          <TextSmall strong>{title}</TextSmall>
          {!!selected?.length && (
            <Pill flavour="neutral" hollow data-testid={`${testIdPrefix}-selected-count`} tiny>
              {selected?.length}
            </Pill>
          )}
        </Flex>
        {!!selected?.length && (
          <Button
            padding={[0]}
            flavour="borderless"
            onClick={e => {
              e.stopPropagation()
              setSelected([])
            }}
            data-testid={`${testIdPrefix}-filter-resetAll`}
            label="Reset"
            small
          />
        )}
      </Flex>
      {children}
    </Flex>
  )
}

export default FilterGroup
