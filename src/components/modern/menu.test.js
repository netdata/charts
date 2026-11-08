import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { ThemeProvider } from "styled-components"
import { Box, DarkTheme, DefaultTheme } from "@netdata/netdata-ui"
import { Item } from "./menu"

describe.each([DefaultTheme, DarkTheme])("modern chart menu in $name", theme => {
  it("visually distinguishes a checked option on the dropdown surface", () => {
    render(
      <ThemeProvider theme={theme}>
        <Box background="dropdown" data-testid="chart-menu-surface">
          <Item check={false} role="menuitemradio" aria-checked={false}>
            Series
          </Item>
          <Item check role="menuitemradio" aria-checked>
            Dimensions
          </Item>
        </Box>
      </ThemeProvider>
    )

    const selected = screen.getByRole("menuitemradio", { checked: true })
    const other = screen.getByRole("menuitemradio", { checked: false })
    const host = screen.getByTestId("chart-menu-surface")
    const fills = [selected, other, host].map(node => getComputedStyle(node).backgroundColor)

    expect(fills[0]).not.toEqual(fills[1])
    expect(fills[0]).not.toEqual(fills[2])
    expect(selected).toHaveTextContent("✓")
  })
})
