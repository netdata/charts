import { css } from "styled-components"

const cursorByNavigation = {
  default: "default",
  selectVertical: "row-resize",
  select: "col-resize",
  highlight: "crosshair",
}

const activeCursorByNavigation = {
  ...cursorByNavigation,
  pan: "grabbing",
}

const getCursor = ({ navigation, $cellClick }) =>
  $cellClick ? "pointer" : cursorByNavigation[navigation] || cursorByNavigation.default

export default css`
  cursor: ${getCursor};

  ${props => {
    const activeCursor = activeCursorByNavigation[props.navigation]
    if (!activeCursor) return ""
    return `
      &:active {
        cursor: ${activeCursor};
      }
    `
  }}
  &:active {
    cursor: ${props => activeCursorByNavigation[props.navigation] || cursorByNavigation.default};
  }
`
