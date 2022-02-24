import { css, keyframes } from "styled-components"

const frames = keyframes`
  from { opacity: 0.4; }
  to { opacity: 1; }
`

const textAnimation = css`
  animation: ${frames} 1.6s ease-in infinite;
`

export default textAnimation
