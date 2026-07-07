import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import Drawer from "./index"
import { actions } from "./constants"

describe("Drawer", () => {
  it("lets the values table own vertical scrolling", () => {
    renderWithChart(<Drawer />, {
      attributes: { drawer: { action: actions.values } },
    })

    expect(screen.getByTestId("drawer-content")).toHaveStyle({
      minHeight: "0",
      overflowY: "hidden",
    })
  })

  it("keeps drawer scrolling for non-table actions", () => {
    renderWithChart(<Drawer />, {
      attributes: { drawer: { action: actions.compare } },
    })

    expect(screen.getByTestId("drawer-content")).toHaveStyle({
      minHeight: "0",
      overflowY: "scroll",
    })
  })
})
