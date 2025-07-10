import makeResizeObserver from "."

describe("makeResizeObserver", () => {
  let mockElement
  let mockObserver
  let observeCallback

  beforeEach(() => {
    jest.useFakeTimers()

    mockElement = {}
    mockObserver = {
      observe: jest.fn(),
      disconnect: jest.fn(),
    }

    global.ResizeObserver = jest.fn(callback => {
      observeCallback = callback
      return mockObserver
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it("creates and observes element", () => {
    const action = jest.fn()
    const initialAction = jest.fn()

    makeResizeObserver(mockElement, action, initialAction)

    expect(global.ResizeObserver).toBeCalledWith(expect.any(Function))
    expect(mockObserver.observe).toBeCalledWith(mockElement)
  })

  it("calls initialAction on first resize after delay", () => {
    const action = jest.fn()
    const initialAction = jest.fn()

    makeResizeObserver(mockElement, action, initialAction)

    observeCallback()
    expect(initialAction).not.toBeCalled()

    jest.advanceTimersByTime(200)
    expect(initialAction).toBeCalled()
    expect(action).not.toBeCalled()
  })

  it("calls action on subsequent resizes after delay", () => {
    const action = jest.fn()
    const initialAction = jest.fn()

    makeResizeObserver(mockElement, action, initialAction)

    observeCallback()
    jest.advanceTimersByTime(200)

    observeCallback()
    expect(action).not.toBeCalled()

    jest.advanceTimersByTime(200)
    expect(action).toBeCalled()
    expect(initialAction).toBeCalledTimes(1)
  })

  it("debounces rapid resize events", () => {
    const action = jest.fn()

    makeResizeObserver(mockElement, action)

    observeCallback()
    jest.advanceTimersByTime(200)

    observeCallback()
    observeCallback()
    observeCallback()

    jest.advanceTimersByTime(100)
    expect(action).not.toBeCalled()

    jest.advanceTimersByTime(200)
    expect(action).toBeCalledTimes(1)
  })

  it("handles missing initialAction", () => {
    const action = jest.fn()

    makeResizeObserver(mockElement, action)

    observeCallback()
    jest.advanceTimersByTime(200)

    expect(action).not.toBeCalled()
  })

  it("returns cleanup function that disconnects observer", () => {
    const action = jest.fn()
    const cleanup = makeResizeObserver(mockElement, action)

    cleanup()

    expect(mockObserver.disconnect).toBeCalled()
  })

  it("clears pending timeouts on cleanup", () => {
    const action = jest.fn()
    const cleanup = makeResizeObserver(mockElement, action)

    observeCallback()
    cleanup()
    jest.advanceTimersByTime(300)

    expect(action).not.toBeCalled()
  })
})
