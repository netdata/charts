import makeKeyboardListener from "./index"

const press = (listener, code) => {
  listener.eventListener({ type: "keydown", code })
  listener.eventListener({ type: "keyup", code })
}

describe("makeKeyboardListener", () => {
  it("removes the handler it registered even after an earlier one is removed", () => {
    const listener = makeKeyboardListener()
    const first = jest.fn()
    const second = jest.fn()
    const third = jest.fn()

    const offFirst = listener.onKeyChange(["KeyA"], first)
    const offSecond = listener.onKeyChange(["KeyB"], second)
    listener.onKeyChange(["KeyC"], third)

    offFirst()
    offSecond()

    press(listener, "KeyC")
    press(listener, "KeyB")

    expect(third).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()
  })
})
