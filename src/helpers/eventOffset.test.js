import eventOffset from "./eventOffset"

describe("eventOffset", () => {
  let mockElement

  beforeEach(() => {
    mockElement = {
      getBoundingClientRect: jest.fn(() => ({
        left: 100,
        top: 50,
        width: 200,
        height: 150
      }))
    }
  })

  it("calculates offset for mouse events", () => {
    const event = {
      target: mockElement,
      clientX: 150,
      clientY: 75,
      type: "click"
    }

    const result = eventOffset(event)

    expect(result).toEqual({
      offsetX: 50,
      offsetY: 25
    })
  })

  it("calculates offset for touch events with initialTouches", () => {
    const event = {
      target: mockElement,
      type: "touchstart"
    }
    const ctx = {
      initialTouches: [{
        pageX: 175,
        pageY: 100
      }]
    }

    const result = eventOffset(event, ctx)

    expect(result).toEqual({
      offsetX: 75,
      offsetY: 50
    })
  })

  it("handles touch events without initialTouches", () => {
    const event = {
      target: mockElement,
      type: "touchmove"
    }

    const result = eventOffset(event, {})

    expect(result).toEqual({
      offsetX: NaN,
      offsetY: NaN
    })
  })

  it("uses srcElement as fallback for target", () => {
    const event = {
      srcElement: mockElement,
      clientX: 120,
      clientY: 60,
      type: "mousedown"
    }

    const result = eventOffset(event)

    expect(result).toEqual({
      offsetX: 20,
      offsetY: 10
    })
  })

  it("handles events with no coordinates", () => {
    const event = {
      target: mockElement,
      type: "click"
    }

    const result = eventOffset(event)

    expect(result).toEqual({
      offsetX: NaN,
      offsetY: NaN
    })
  })
})