import { css, keyframes } from "styled-components"
import reducedMotion from "@/components/helpers/reducedMotion"

const frames = keyframes`
  from { opacity: 0.4; }
  to { opacity: 1; }
`

const textAnimation = css`
  animation: ${frames} 1.6s ease-in infinite;
  ${reducedMotion("opacity: 0.7;")}
`

export default textAnimation
