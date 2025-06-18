import makeListeners from "./index"

describe("makeListeners", () => {
  let listeners

  beforeEach(() => {
    listeners = makeListeners()
  })

  it("triggers a listener", () => {
    const spy = jest.fn()
    listeners.on("ring", spy)
    listeners.trigger("ring", "phone")

    expect(spy).toBeCalledTimes(1)
    expect(spy).toBeCalledWith("phone", "ring")
  })

  it("triggers multiple listeners for same event", () => {
    const spy1 = jest.fn()
    const spy2 = jest.fn()

    listeners.on("test", spy1)
    listeners.on("test", spy2)
    listeners.trigger("test", "data")

    expect(spy1).toBeCalledWith("data", "test")
    expect(spy2).toBeCalledWith("data", "test")
  })

  it("removes listener with off", () => {
    const spy = jest.fn()
    listeners.on("test", spy)
    listeners.off("test", spy)
    listeners.trigger("test", "data")

    expect(spy).not.toBeCalled()
  })

  it("returns remove function from on", () => {
    const spy = jest.fn()
    const remove = listeners.on("test", spy)

    remove()
    listeners.trigger("test", "data")

    expect(spy).not.toBeCalled()
  })

  it("supports chaining with returned remove function", () => {
    const spy1 = jest.fn()
    const spy2 = jest.fn()

    const remove = listeners.on("test1", spy1)
    remove.on("test2", spy2)

    listeners.trigger("test1", "data1")
    listeners.trigger("test2", "data2")

    expect(spy1).toBeCalledWith("data1", "test1")
    expect(spy2).toBeCalledWith("data2", "test2")

    remove()
    listeners.trigger("test1", "data1")
    listeners.trigger("test2", "data2")

    expect(spy1).toBeCalledTimes(1)
    expect(spy2).toBeCalledTimes(1)
  })

  it("supports once listeners", () => {
    const spy = jest.fn()
    listeners.once("test", spy)

    listeners.trigger("test", "data1")
    listeners.trigger("test", "data2")

    expect(spy).toBeCalledTimes(1)
    expect(spy).toBeCalledWith("data1", "test")
  })

  it("removes once listener with returned function", () => {
    const spy = jest.fn()
    const remove = listeners.once("test", spy)

    remove()
    listeners.trigger("test", "data")

    expect(spy).not.toBeCalled()
  })

  it("removes all listeners with offAll", () => {
    const spy1 = jest.fn()
    const spy2 = jest.fn()

    listeners.on("test1", spy1)
    listeners.on("test2", spy2)
    listeners.offAll()

    listeners.trigger("test1", "data")
    listeners.trigger("test2", "data")

    expect(spy1).not.toBeCalled()
    expect(spy2).not.toBeCalled()
  })

  it("passes multiple arguments to listeners", () => {
    const spy = jest.fn()
    listeners.on("test", spy)
    listeners.trigger("test", "arg1", "arg2", "arg3")

    expect(spy).toBeCalledWith("arg1", "arg2", "arg3", "test")
  })
})
