import React, { useState } from "react"
import styled from "styled-components"
import { Box, Flex, TextMicro } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"
import { Item } from "@/components/modern/menu"
import { getSupportedValueFocus, resolveValueFocus, valueFocusOptions } from "@/helpers/valueFocus"

const OptionText = styled(Box).attrs({ as: "span" })`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

export const useValueFocus = chartType => {
  const requested = useAttributeValue("valueFocus")
  const inherited = useAttributeValue("valueFocusDefault")
  return resolveValueFocus(chartType, requested, { inherited })
}

export const useFocusChoices = () => {
  const chartLibrary = useAttributeValue("chartLibrary")
  const current = useValueFocus(chartLibrary)
  const supported = getSupportedValueFocus(chartLibrary)
  const options = valueFocusOptions.filter(({ value }) => supported.includes(value))

  return {
    options: options.length > 1 ? options : [],
    current: valueFocusOptions.find(({ value }) => value === current) || null,
  }
}

export const FocusOptions = ({ onSelect }) => {
  const chart = useChart()
  const { options, current } = useFocusChoices()

  return options.map(({ value, label, question }) => (
    <Item
      key={value}
      role="menuitemradio"
      check={value === current?.value}
      aria-checked={value === current?.value}
      data-value={value}
      data-testid={`valueFocus-${value}`}
      data-track={chart.track(`valueFocus-${value}`)}
      onClick={() => {
        chart.updateAttribute("valueFocus", value)
        onSelect?.(value)
      }}
    >
      <OptionText>
        <span>{label}</span>
        <TextMicro as="span" color="textLite">
          {question}
        </TextMicro>
      </OptionText>
    </Item>
  ))
}

export const FocusPanel = ({ onBack }) => <FocusOptions onSelect={onBack} />

export const focusMenuItem = {
  id: "valueFocus",
  group: "show",
  order: 40,
  useItem: () => {
    const { options, current } = useFocusChoices()

    if (!options.length) return null

    return {
      label: "Focus",
      hint: current?.label,
      testId: "chartMore-valueFocus",
      track: "valueFocus",
      Panel: FocusPanel,
    }
  },
}

export const FocusItem = () => {
  const [open, setOpen] = useState(false)
  const { options, current } = useFocusChoices()

  if (!options.length) return null

  return (
    <>
      <Item
        hint={current?.label}
        drill
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
        data-testid="valueFocus-toggle"
      >
        Focus
      </Item>
      {open && (
        <Flex column role="group" aria-label="Focus" padding={[0, 0, 0, 2]}>
          <FocusOptions />
        </Flex>
      )}
    </>
  )
}
