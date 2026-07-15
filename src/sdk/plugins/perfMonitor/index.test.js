import { act } from "@testing-library/react"
import { makeTestChart } from "@jest/testUtilities"
import { isEnabled, reset } from "./registry"

describe("perfMonitor plugin", () => {
  afterEach(() => {
    document.body.innerHTML = ""
    reset()
  })

  it("mounts the overlay and enables the registry when perfMonitor turns on, and tears down when off", () => {
    const { sdk } = makeTestChart()

    expect(document.querySelector("[data-testid='perfOverlay-root']")).toBeNull()
    expect(isEnabled()).toBe(false)

    act(() => {
      sdk.getRoot().updateAttributes({ perfMonitor: true })
    })

    expect(document.querySelector("[data-testid='perfOverlay-root']")).not.toBeNull()
    expect(isEnabled()).toBe(true)

    act(() => {
      sdk.getRoot().updateAttributes({ perfMonitor: false })
    })

    expect(document.querySelector("[data-testid='perfOverlay-root']")).toBeNull()
    expect(isEnabled()).toBe(false)
  })
})
