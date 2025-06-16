import makeExecuteLatest from "."

describe("makeExecuteLatest", () => {
  let executeLatest

  beforeEach(() => {
    executeLatest = makeExecuteLatest()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("executes callback after timeout", () => {
    const callback = jest.fn()
    const execute = executeLatest.add(callback)

    execute("arg1", "arg2")
    expect(callback).not.toBeCalled()

    jest.runAllTimers()
    expect(callback).toBeCalledWith("arg1", "arg2")
  })

  it("cancels previous timeout when called again", () => {
    const callback = jest.fn()
    const execute = executeLatest.add(callback)

    execute("first")
    execute("second")

    jest.runAllTimers()
    expect(callback).toBeCalledTimes(1)
    expect(callback).toBeCalledWith("second")
  })

  it("handles multiple execute functions", () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()
    const execute1 = executeLatest.add(callback1)
    const execute2 = executeLatest.add(callback2)

    execute1("first")
    execute2("second")

    jest.runAllTimers()
    expect(callback1).toBeCalledWith("first")
    expect(callback2).toBeCalledWith("second")
  })

  it("clears all pending timeouts", () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()
    const execute1 = executeLatest.add(callback1)
    const execute2 = executeLatest.add(callback2)

    execute1("first")
    execute2("second")
    
    executeLatest.clear()
    jest.runAllTimers()

    expect(callback1).not.toBeCalled()
    expect(callback2).not.toBeCalled()
  })

  it("clears previous timeout before setting new one", () => {
    const callback = jest.fn()
    const execute = executeLatest.add(callback)

    execute("first")
    const firstTimeoutId = setTimeout(() => {}, 0)
    
    execute("second")
    jest.runAllTimers()

    expect(callback).toBeCalledTimes(1)
    expect(callback).toBeCalledWith("second")
  })
})