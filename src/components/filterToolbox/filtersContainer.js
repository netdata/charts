import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"

const FiltersContainer = styled(Flex).attrs(props => ({
  alignItems: "center",
  border: { side: "bottom", color: "borderSecondary" },
  overflow: "auto",
  justifyContent: "between",
  flex: false,
  ...props,
}))`
  &::-webkit-scrollbar {
    height: 0;
  }
`

export default FiltersContainer
