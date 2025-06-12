import React, { useState } from "react"
import Icon, { Button } from "@/components/icon"
import { Flex, TextInput } from "@netdata/netdata-ui"
import xIcon from "@netdata/netdata-ui/dist/components/icon/assets/x.svg"
import checkIcon from "@netdata/netdata-ui/dist/components/icon/assets/check.svg"
import ColorPicker from "./colorPicker"

const AnnotationForm = ({
  initialText = "",
  initialColor = "#0075F2",
  initialPriority = "info",
  placeholder = "Annotation text...",
  onSave,
  onCancel,
  autoFocus = true,
}) => {
  const [text, setText] = useState(initialText)
  const [color, setColor] = useState(initialColor)
  const [priority, setPriority] = useState(initialPriority)

  const handleColorChange = (newColor, newPriority) => {
    setColor(newColor)
    setPriority(newPriority)
  }

  const handleSave = () => {
    if (!text.trim()) return
    onSave({
      text: text.trim(),
      color,
      priority,
    })
  }

  const handleKeyDown = e => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <Flex column gap={1}>
      <Flex gap={1} alignItems="center">
        <TextInput
          name="annotation-text"
          placeholder={placeholder}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          size="tiny"
        />
        <Button
          icon={<Icon svg={checkIcon} size="16px" />}
          onClick={handleSave}
          disabled={!text.trim()}
          size="small"
        />
        <Button
          icon={<Icon svg={xIcon} size="16px" />}
          onClick={onCancel}
          size="small"
          variant="secondary"
        />
      </Flex>
      <ColorPicker selectedColor={color} onColorChange={handleColorChange} />
    </Flex>
  )
}

export default AnnotationForm
