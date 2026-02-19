import { renderHook, act } from "@testing-library/react"
import useWindowSize from "./useWindowSize"

describe("useWindowSize", () => {
  let addEventListenerSpy
  let removeEventListenerSpy

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(window, "addEventListener")
    removeEventListenerSpy = jest.spyOn(window, "removeEventListener")
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true, configurable: true })
    Object.defineProperty(window, "innerHeight", { value: 768, writable: true, configurable: true })
  })

  afterEach(() => {
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })

  it("returns initial window size", () => {
    const { result } = renderHook(() => useWindowSize())

    expect(result.current).toEqual({
      width: 1024,
      height: 768,
    })
  })

  it("initializes with current window dimensions", () => {
    const { result } = renderHook(() => useWindowSize())

    expect(result.current.width).toBe(1024)
    expect(result.current.height).toBe(768)
  })

  it("adds resize event listener on mount", () => {
    renderHook(() => useWindowSize())

    expect(addEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function))
  })

  it("updates size when window is resized", () => {
    const { result } = renderHook(() => useWindowSize())

    Object.defineProperty(window, "innerWidth", { value: 1280, writable: true, configurable: true })
    Object.defineProperty(window, "innerHeight", { value: 720, writable: true, configurable: true })

    act(() => {
      window.dispatchEvent(new Event("resize"))
    })

    expect(result.current).toEqual({
      width: 1280,
      height: 720,
    })
  })

  it("removes resize event listener on unmount", () => {
    const { unmount } = renderHook(() => useWindowSize())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function))
  })

  it("handles multiple resize events correctly", () => {
    const { result } = renderHook(() => useWindowSize())

    Object.defineProperty(window, "innerWidth", { value: 800, writable: true, configurable: true })
    Object.defineProperty(window, "innerHeight", { value: 600, writable: true, configurable: true })
    act(() => {
      window.dispatchEvent(new Event("resize"))
    })

    expect(result.current).toEqual({ width: 800, height: 600 })

    Object.defineProperty(window, "innerWidth", { value: 1920, writable: true, configurable: true })
    Object.defineProperty(window, "innerHeight", { value: 1080, writable: true, configurable: true })
    act(() => {
      window.dispatchEvent(new Event("resize"))
    })

    expect(result.current).toEqual({ width: 1920, height: 1080 })
  })
})
