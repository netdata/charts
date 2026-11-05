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
    expect(callback).not.toHaveBeenCalled()

    jest.runAllTimers()
    expect(callback).toHaveBeenCalledWith("arg1", "arg2")
  })

  it("cancels previous timeout when called again", () => {
    const callback = jest.fn()
    const execute = executeLatest.add(callback)

    execute("first")
    execute("second")

    jest.runAllTimers()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith("second")
  })

  it("handles multiple execute functions", () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()
    const execute1 = executeLatest.add(callback1)
    const execute2 = executeLatest.add(callback2)

    execute1("first")
    execute2("second")

    jest.runAllTimers()
    expect(callback1).toHaveBeenCalledWith("first")
    expect(callback2).toHaveBeenCalledWith("second")
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

    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).not.toHaveBeenCalled()
  })

  it("clears previous timeout before setting new one", () => {
    const callback = jest.fn()
    const execute = executeLatest.add(callback)

    execute("first")
    const firstTimeoutId = setTimeout(() => {}, 0)

    execute("second")
    jest.runAllTimers()

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith("second")
  })
})
