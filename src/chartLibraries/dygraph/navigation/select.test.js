import selectNavigation from "./select"

describe("select navigation", () => {
  let chartUI

  beforeEach(() => {
    chartUI = {
      sdk: {
        trigger: jest.fn()
      },
      chart: {
        trigger: jest.fn()
      },
      on: jest.fn(() => chartUI),
      off: jest.fn(() => chartUI)
    }
  })

  it("returns chartUI object from setup", () => {
    const result = selectNavigation(chartUI)
    expect(result).toBe(chartUI)
  })

  it("sets up mousedown event handler", () => {
    selectNavigation(chartUI)
    expect(chartUI.on).toHaveBeenCalledWith("mousedown", expect.any(Function))
  })
})