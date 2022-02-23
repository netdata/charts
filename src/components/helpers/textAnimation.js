import { css, keyframes } from "styled-components"
import { getColor } from "@netdata/netdata-ui/lib/theme/utils"

const getFrames = (startColor, endColor) => keyframes`
  0% {
    color:${startColor};
  }
  100% {
    color:${endColor};
  }
  `

const textAnimation = css`
  animation: ${({ theme }) =>
      getFrames(getColor("border")({ theme }), getColor("primary")({ theme }))}
    1000ms linear forwards;
  animation-delay: 0s;
  animation-iteration-count: infinite;
  -webkit-backface-visibility: hidden;
  visibility: visible;
`

export default textAnimation
