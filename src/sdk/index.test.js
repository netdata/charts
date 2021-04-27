import SDK from "./index"

it("creates sdk", () => {
  expect(() => {
    new SDK()
  }).not.toThrow()
})
