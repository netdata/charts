import React from "react"
import Tooltip from "@/components/tooltip"
import { Flex } from "@netdata/netdata-ui"
import styled from "styled-components"

export const annotationPriorities = [
  { name: "debug", color: "#9E9E9E", label: "Debug" },
  { name: "info", color: "#0075F2", label: "Info" },
  { name: "warning", color: "#FFCC26", label: "Warning" },
  { name: "error", color: "#F95251", label: "Error" },
  { name: "critical", color: "#D32F2F", label: "Critical" },
]

const ColorOption = styled.div`
  width: 12px;
  height: 8px;
  border-radius: 2px;
  cursor: pointer;
  border: 1px solid ${props => (props.selected ? "#fff" : "transparent")};
  background-color: ${props => props.color};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: scale(1.1);
  }
`

const ColorPicker = ({ selectedColor, onColorChange }) => (
  <Flex gap={1} alignItems="center">
    {annotationPriorities.map(priority => (
      <Tooltip key={priority.name} content={priority.label}>
        <ColorOption
          color={priority.color}
          selected={selectedColor === priority.color}
          onClick={() => onColorChange(priority.color, priority.name)}
        />
      </Tooltip>
    ))}
  </Flex>
)

export default ColorPicker
