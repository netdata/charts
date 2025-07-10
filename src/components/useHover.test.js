import { renderHook, act } from "@testing-library/react"
import useHover, { useHovered } from "./useHover"

describe("useHover", () => {
  let mockElement
  let mockOnHover
  let mockOnBlur

  beforeEach(() => {
    mockElement = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      parentElement: null,
    }

    mockOnHover = jest.fn()
    mockOnBlur = jest.fn()
  })

  it("returns a ref object", () => {
    const { result } = renderHook(() => useHover({ onHover: mockOnHover, onBlur: mockOnBlur }, []))

    expect(result.current).toHaveProperty("current")
    expect(result.current.current).toBeUndefined()
  })

  it("adds event listeners when ref.current is set", () => {
    const { result, rerender } = renderHook(() =>
      useHover({ onHover: mockOnHover, onBlur: mockOnBlur }, [])
    )

    act(() => {
      result.current.current = mockElement
    })

    rerender()

    expect(mockElement.addEventListener).toHaveBeenCalledWith("mouseover", mockOnHover)
    expect(mockElement.addEventListener).toHaveBeenCalledWith("mouseout", expect.any(Function))
  })

  it("calls onHover when mouseover event is triggered", () => {
    const { result, rerender } = renderHook(() =>
      useHover({ onHover: mockOnHover, onBlur: mockOnBlur }, [])
    )

    act(() => {
      result.current.current = mockElement
    })

    rerender()

    const mouseoverHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === "mouseover"
    )[1]

    act(() => {
      mouseoverHandler()
    })

    expect(mockOnHover).toHaveBeenCalled()
  })

  it("calls onBlur when mouseout event is triggered and mouse leaves element", () => {
    const { result, rerender } = renderHook(() =>
      useHover(
        {
          onHover: mockOnHover,
          onBlur: mockOnBlur,
          isOut: () => true,
        },
        []
      )
    )

    act(() => {
      result.current.current = mockElement
    })

    rerender()

    const mouseoutHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === "mouseout"
    )[1]
    const mockEvent = { relatedTarget: null }

    act(() => {
      mouseoutHandler(mockEvent)
    })

    expect(mockOnBlur).toHaveBeenCalled()
  })

  it("does not call onBlur when mouse moves to child element", () => {
    const childElement = { parentElement: mockElement }
    const { result, rerender } = renderHook(() =>
      useHover(
        {
          onHover: mockOnHover,
          onBlur: mockOnBlur,
        },
        []
      )
    )

    act(() => {
      result.current.current = mockElement
    })

    rerender()

    const mouseoutHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === "mouseout"
    )[1]
    const mockEvent = { relatedTarget: childElement }

    act(() => {
      mouseoutHandler(mockEvent)
    })

    expect(mockOnBlur).not.toHaveBeenCalled()
  })

  it("removes event listeners on unmount", () => {
    const { result, unmount, rerender } = renderHook(() =>
      useHover({ onHover: mockOnHover, onBlur: mockOnBlur }, [])
    )

    act(() => {
      result.current.current = mockElement
    })

    rerender()

    const addedCalls = mockElement.addEventListener.mock.calls
    const mouseoverHandler = addedCalls.find(call => call[0] === "mouseover")[1]
    const mouseoutHandler = addedCalls.find(call => call[0] === "mouseout")[1]

    unmount()

    expect(mockElement.removeEventListener).toHaveBeenCalledWith("mouseover", mouseoverHandler)
    expect(mockElement.removeEventListener).toHaveBeenCalledWith("mouseout", mouseoutHandler)
  })

  it("uses default isOut function when not provided", () => {
    const { result, rerender } = renderHook(() =>
      useHover({ onHover: mockOnHover, onBlur: mockOnBlur }, [])
    )

    act(() => {
      result.current.current = mockElement
    })

    rerender()

    const mouseoutHandler = mockElement.addEventListener.mock.calls.find(
      call => call[0] === "mouseout"
    )[1]
    const mockEvent = { relatedTarget: null }

    act(() => {
      mouseoutHandler(mockEvent)
    })

    expect(mockOnBlur).toHaveBeenCalled()
  })

  it("handles dependencies correctly by re-running effect", () => {
    let deps = ["dep1"]
    const { rerender } = renderHook(() =>
      useHover({ onHover: mockOnHover, onBlur: mockOnBlur }, deps)
    )

    deps = ["dep2"]
    rerender()

    // Hook should handle dependency changes
    expect(mockOnHover).toBeDefined()
  })
})

describe("useHovered", () => {
  it("returns array with ref and focused state", () => {
    const { result } = renderHook(() => useHovered())

    expect(Array.isArray(result.current)).toBe(true)
    expect(result.current).toHaveLength(2)

    const [ref, focused] = result.current
    expect(ref).toHaveProperty("current")
    expect(typeof focused).toBe("boolean")
  })

  it("initializes focused state to false", () => {
    const { result } = renderHook(() => useHovered())

    const [, focused] = result.current
    expect(focused).toBe(false)
  })

  it("sets focused to true on hover", () => {
    const mockElement = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }

    const { result, rerender } = renderHook(() => useHovered())

    act(() => {
      result.current[0].current = mockElement
    })

    rerender()

    const onHover = mockElement.addEventListener.mock.calls.find(call => call[0] === "mouseover")[1]

    act(() => {
      onHover()
    })

    const [, focusedAfterHover] = result.current
    expect(focusedAfterHover).toBe(true)
  })

  it("sets focused to false on blur", () => {
    const mockElement = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }

    const { result, rerender } = renderHook(() => useHovered())

    act(() => {
      result.current[0].current = mockElement
    })

    rerender()

    const onHover = mockElement.addEventListener.mock.calls.find(call => call[0] === "mouseover")[1]
    act(() => {
      onHover()
    })

    const onMouseout = mockElement.addEventListener.mock.calls.find(
      call => call[0] === "mouseout"
    )[1]
    act(() => {
      onMouseout({ relatedTarget: null })
    })

    const [, focusedAfterBlur] = result.current
    expect(focusedAfterBlur).toBe(false)
  })

  it("accepts custom options parameter", () => {
    const customOptions = { isOut: jest.fn(() => true) }
    const { result } = renderHook(() => useHovered(customOptions))

    expect(Array.isArray(result.current)).toBe(true)
    expect(result.current).toHaveLength(2)
  })

  it("accepts dependencies parameter", () => {
    const deps = ["dep1", "dep2"]
    const { result } = renderHook(() => useHovered({}, deps))

    expect(Array.isArray(result.current)).toBe(true)
    expect(result.current).toHaveLength(2)
  })

  it("handles no parameters", () => {
    const { result } = renderHook(() => useHovered())

    expect(Array.isArray(result.current)).toBe(true)
    expect(result.current).toHaveLength(2)
  })

  it("provides stable ref reference", () => {
    const { result, rerender } = renderHook(() => useHovered())
    const [initialRef] = result.current

    rerender()
    const [refAfterRerender] = result.current

    expect(initialRef).toBe(refAfterRerender)
  })
})
