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

export default css`
  cursor: ${props => cursorByNavigation[props.navigation] || cursorByNavigation.default};

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
