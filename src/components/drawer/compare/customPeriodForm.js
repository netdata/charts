import React, { useState } from "react"
import { Flex, TextSmall, TextMicro, Button } from "@netdata/netdata-ui"

const CustomPeriodForm = ({ onAdd, onCancel }) => {
  const [label, setLabel] = useState("")
  const [offsetDays, setOffsetDays] = useState("")
  const [offsetHours, setOffsetHours] = useState("")

  const generateLabel = (days, hours) => {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always" })

    if (days > 0 && hours === 0) {
      return rtf.format(-days, "day")
    }
    if (hours > 0 && days === 0) {
      return rtf.format(-hours, "hour")
    }
    if (days > 0 && hours > 0) {
      return rtf.format(-days, "day")
    }
    return ""
  }

  const handleAdd = () => {
    const days = parseInt(offsetDays) || 0
    const hours = parseInt(offsetHours) || 0
    const offsetSeconds = days * 24 * 60 * 60 + hours * 60 * 60

    if (offsetSeconds <= 0) return

    const finalLabel = label.trim() || generateLabel(days, hours)
    if (!finalLabel) return

    const customPeriod = {
      id: `custom_${Date.now()}`,
      label: finalLabel,
      offsetSeconds,
    }

    onAdd(customPeriod)
  }

  return (
    <Flex
      column
      gap={2}
      padding={[3]}
      border="all"
      round
      width={{ min: "200px" }}
      background="neutral"
    >
      <TextSmall strong>Add Custom Period</TextSmall>

      <Flex column gap={1}>
        <TextMicro>Label</TextMicro>
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="e.g. 3 days ago"
          style={{
            padding: "4px",
            fontSize: "12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
        />
      </Flex>

      <Flex gap={2}>
        <Flex column gap={1} flex={1}>
          <TextMicro>Days</TextMicro>
          <input
            type="number"
            value={offsetDays}
            onChange={e => setOffsetDays(e.target.value)}
            min="0"
            style={{
              padding: "4px",
              fontSize: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </Flex>
        <Flex column gap={1} flex={1}>
          <TextMicro>Hours</TextMicro>
          <input
            type="number"
            value={offsetHours}
            onChange={e => setOffsetHours(e.target.value)}
            min="0"
            max="23"
            style={{
              padding: "4px",
              fontSize: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </Flex>
      </Flex>

      <Flex gap={2}>
        <Button tiny label="Add" onClick={handleAdd} />
        <Button tiny label="Cancel" onClick={onCancel} />
      </Flex>
    </Flex>
  )
}

export default CustomPeriodForm
