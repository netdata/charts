import { css } from "styled-components"

const reducedMotion = (rest = "") => css`
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    ${rest}
  }
`

export default reducedMotion
