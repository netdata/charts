import React from "react"
import styled, { css } from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"

const StyledFiltersContainer = styled(Flex).attrs(({ floating, visible, ...rest }) => ({
  alignItems: "center",
  border: { side: "bottom", color: "borderSecondary" },
  overflow: "auto",
  justifyContent: "between",
  flex: false,
  ...rest,
  ...(floating && {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    background: "mainBackground",
    opacity: visible ? 1 : 0,
  }),
}))`
  &::-webkit-scrollbar {
    height: 0;
  }

  ${({ floating, visible }) =>
    floating &&
    css`
      transition: opacity 120ms ease-in-out;
      pointer-events: ${visible ? "auto" : "none"};
    `}
`

const FiltersContainer = props => {
  const mode = useAttributeValue("filterToolboxMode") || "fixed"
  const focused = useAttributeValue("focused")
  const floating = mode === "floating"

  return <StyledFiltersContainer floating={floating} visible={!floating || focused} {...props} />
}

export default FiltersContainer
