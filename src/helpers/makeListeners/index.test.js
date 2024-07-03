import makeListeners from "./index"

it("triggers a listener", () => {
  const listener = makeListeners()

  const spy = jest.fn()
  listener.on("ring", spy)
  listener.trigger("ring", "phone")

  expect(spy).toBeCalledTimes(1)
  expect(spy).toBeCalledWith("phone", "ring")
})
