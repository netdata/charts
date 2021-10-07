import withIntersection from "@/components/hocs/withIntersection"
import styled from "styled-components"

const StyledFallback = styled.div`
  padding-bottom: 100%;
  width: 100%;
`

export default Component => {
  return withIntersection(Component, { Fallback: StyledFallback })
}
