import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { ThemeProvider } from "styled-components"
import { Box, DarkTheme, DefaultTheme } from "@netdata/netdata-ui"
import { Item } from "./menu"

describe.each([DefaultTheme, DarkTheme])("modern chart menu in $name", theme => {
  it("keeps checkbox rows clear at rest and marks selection with the checkbox", () => {
    render(
      <ThemeProvider theme={theme}>
        <Box background="dropdown">
          <Item check>Requests</Item>
          <Item check={false}>Errors</Item>
        </Box>
      </ThemeProvider>
    )

    const selected = screen.getByRole("menuitemcheckbox", { checked: true })
    const other = screen.getByRole("menuitemcheckbox", { checked: false })
    expect(getComputedStyle(selected).backgroundColor).toBe(getComputedStyle(other).backgroundColor)
    expect(selected.querySelector('[data-state="checked"]')).toHaveAttribute("aria-hidden", "true")
  })

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
    expect(selected.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument()
  })
})
