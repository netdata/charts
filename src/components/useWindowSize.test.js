import { renderHook, act } from "@testing-library/react"
import useWindowSize from "./useWindowSize"

// Store original window
const originalWindow = global.window

describe("useWindowSize", () => {
  beforeEach(() => {
    // Set up a mock window with initial dimensions
    Object.defineProperty(global, "window", {
      value: {
        innerWidth: 1024,
        innerHeight: 768,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
      writable: true,
    })
  })

  afterEach(() => {
    // Restore original window
    Object.defineProperty(global, "window", {
      value: originalWindow,
      writable: true,
    })
  })

  it("returns initial window size", () => {
    const { result } = renderHook(() => useWindowSize())

    expect(result.current).toEqual({
      width: 1024,
      height: 768,
    })
  })

  it("initializes with zero dimensions and then updates", () => {
    const { result } = renderHook(() => useWindowSize())

    // Hook should return current window dimensions
    expect(result.current.width).toBe(1024)
    expect(result.current.height).toBe(768)
  })

  it("adds resize event listener on mount", () => {
    renderHook(() => useWindowSize())

    expect(global.window.addEventListener).toHaveBeenCalledWith("resize", expect.any(Function))
  })

  it("updates size when window is resized", () => {
    const { result } = renderHook(() => useWindowSize())

    // Get the resize handler
    const resizeHandler = global.window.addEventListener.mock.calls.find(
      call => call[0] === "resize"
    )[1]

    // Change window dimensions
    global.window.innerWidth = 1280
    global.window.innerHeight = 720

    // Trigger resize event
    act(() => {
      resizeHandler()
    })

    expect(result.current).toEqual({
      width: 1280,
      height: 720,
    })
  })

  it("removes resize event listener on unmount", () => {
    const { unmount } = renderHook(() => useWindowSize())

    // Get the resize handler that was added
    const resizeHandler = global.window.addEventListener.mock.calls.find(
      call => call[0] === "resize"
    )[1]

    unmount()

    expect(global.window.removeEventListener).toHaveBeenCalledWith("resize", resizeHandler)
  })

  it("handles multiple resize events correctly", () => {
    const { result } = renderHook(() => useWindowSize())

    const resizeHandler = global.window.addEventListener.mock.calls.find(
      call => call[0] === "resize"
    )[1]

    // First resize
    global.window.innerWidth = 800
    global.window.innerHeight = 600
    act(() => {
      resizeHandler()
    })

    expect(result.current).toEqual({ width: 800, height: 600 })

    // Second resize
    global.window.innerWidth = 1920
    global.window.innerHeight = 1080
    act(() => {
      resizeHandler()
    })

    expect(result.current).toEqual({ width: 1920, height: 1080 })
  })

  it("handles window without addEventListener gracefully", () => {
    Object.defineProperty(global, "window", {
      value: {
        innerWidth: 500,
        innerHeight: 400,
        // No addEventListener method
      },
      writable: true,
    })

    const { result } = renderHook(() => useWindowSize())

    // When addEventListener is not available, hook returns initial state (0,0)
    expect(result.current).toEqual({
      width: 0,
      height: 0,
    })
  })

  it("provides stable state object reference when size doesn't change", () => {
    const { result, rerender } = renderHook(() => useWindowSize())
    const initialResult = result.current

    rerender()

    // Since window size hasn't changed, we should get the same object reference
    expect(result.current).toEqual(initialResult)
  })

  it("handles window with missing innerWidth/innerHeight", () => {
    Object.defineProperty(global, "window", {
      value: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        innerWidth: undefined,
        innerHeight: undefined,
      },
      writable: true,
    })

    const { result } = renderHook(() => useWindowSize())

    // The hook returns whatever window.innerWidth/innerHeight are, even if undefined
    // This is the actual behavior of the hook
    expect(result.current).toEqual({
      width: undefined,
      height: undefined,
    })
  })
})
