import linePlotter from "./linePlotter"

describe("linePlotter", () => {
  it("returns a function", () => {
    const plotter = linePlotter()
    expect(typeof plotter).toBe("function")
  })
})
