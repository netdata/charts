import React from "react"
import { createRoot } from "react-dom/client"
import mount from "./mount"
import Line from "./components/line"

jest.mock("react-dom/client")
jest.mock("./components/line")

describe("mount", () => {
  let mockRoot
  let mockChart
  let mockElement

  beforeEach(() => {
    mockRoot = {
      render: jest.fn(),
    }
    createRoot.mockReturnValue(mockRoot)
    
    mockChart = {
      getId: jest.fn(() => "test-chart-id"),
      getAttribute: jest.fn(),
    }
    
    mockElement = document.createElement("div")
    
    Line.mockReturnValue(<div>Mocked Line Component</div>)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("creates React root with provided element", () => {
    mount(mockChart, mockElement)

    expect(createRoot).toHaveBeenCalledWith(mockElement)
  })

  it("renders Line component with chart prop wrapped in ThemeProvider", () => {
    mount(mockChart, mockElement)

    expect(mockRoot.render).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.any(Function),
        props: expect.objectContaining({
          theme: expect.any(Object),
          children: expect.objectContaining({
            type: Line,
            props: { chart: mockChart },
          }),
        }),
      })
    )
  })

  it("uses DefaultTheme from netdata-ui", () => {
    mount(mockChart, mockElement)

    const renderCall = mockRoot.render.mock.calls[0][0]
    expect(renderCall.props.theme).toBeDefined()
  })

  it("handles different chart instances", () => {
    const anotherChart = {
      getId: jest.fn(() => "another-chart"),
      getAttribute: jest.fn(),
    }

    mount(anotherChart, mockElement)

    expect(mockRoot.render).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          children: expect.objectContaining({
            props: { chart: anotherChart },
          }),
        }),
      })
    )
  })

  it("handles different DOM elements", () => {
    const anotherElement = document.createElement("section")
    
    mount(mockChart, anotherElement)

    expect(createRoot).toHaveBeenCalledWith(anotherElement)
  })
})