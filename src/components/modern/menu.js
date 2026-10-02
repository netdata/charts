import React from "react"
import styled from "styled-components"
import { Box, Flex, getColor } from "@netdata/netdata-ui"
import { TileMenuContext } from "@/components/modern/tile/context"

export const dropProps = {
  align: { top: "bottom", right: "right" },
  background: "dropdown",
  margin: [1, 0, 0],
  round: true,
}

export const Toolbar = styled(Flex).attrs({ alignItems: "center", gap: 0.5 })`
  transition: opacity 120ms ease-in-out;

  &:focus-within {
    opacity: 1;
  }
`

export const Panel = styled(Flex).attrs(({ width = "260px" }) => ({
  column: true,
  padding: [1],
  width,
}))`
  font-size: 12.5px;
`

const Row = styled(Flex).attrs({
  as: "button",
  alignItems: "center",
  justifyContent: "between",
  gap: 4,
  width: "100%",
  round: 1,
  padding: [1, 2],
  cursor: "pointer",
  color: "text",
})`
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  text-align: left;

  &:hover:not(:disabled) {
    background: ${getColor("mainChartTboxHover")};
  }

  &:disabled {
    cursor: default;
    color: ${getColor("textLite")};
  }
`

const Check = styled(Box).attrs({ as: "span", width: 4 })`
  display: inline-block;
  flex: none;
  color: ${getColor("primary")};
`

const Content = styled(Flex).attrs({ as: "span", alignItems: "center", overflow: "hidden" })`
  color: inherit;
  min-width: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const Hint = styled(Box).attrs({ as: "span" })`
  flex-shrink: 0;
  color: ${getColor("textLite")};
  white-space: nowrap;
`

export const Divider = () => <Box margin={[1, 0]} height="1px" background="borderSecondary" />

export const Item = ({ children, hint, check, contentGap, ...rest }) => (
  <Row type="button" role="menuitem" {...rest}>
    <Content gap={contentGap}>
      {check !== undefined && <Check>{check ? "✓" : ""}</Check>}
      {children}
    </Content>
    {!!hint && <Hint>{hint}</Hint>}
  </Row>
)

export const MenuElements = ({ elements, focused, ...rest }) =>
  elements.length > 0 ? (
    <Flex
      alignItems="center"
      gap={1}
      padding={[0.5, 1.5, 1.5]}
      border={{ side: "bottom", color: "borderSecondary" }}
      margin={[0, 0, 1]}
      flexWrap
      {...rest}
    >
      <TileMenuContext.Provider value>
        {elements.map((Element, index) => (
          <Element key={index} disabled={!focused} />
        ))}
      </TileMenuContext.Provider>
    </Flex>
  ) : null
