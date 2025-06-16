import makeChartUI from "./makeChartUI"

describe("makeChartUI", () => {
  let chartUI
  let mockSDK
  let mockChart
  let mockElement

  beforeEach(() => {
    mockSDK = {
      trigger: jest.fn()
    }
    
    mockChart = {
      getDateWindow: jest.fn(() => [1000, 2000]),
      trigger: jest.fn(),
      on: jest.fn()
    }

    mockElement = {
      offsetWidth: 800,
      offsetHeight: 400
    }

    chartUI = makeChartUI(mockSDK, mockChart)
  })

  it("initializes with chart properties", () => {
    expect(chartUI.sdk).toBe(mockSDK)
    expect(chartUI.chart).toBe(mockChart)
    expect(chartUI.getRenderedAt()).toBe(2000)
  })

  describe("mount", () => {
    it("sets element and triggers mount events", () => {
      chartUI.mount(mockElement)

      expect(chartUI.getElement()).toBe(mockElement)
      expect(mockSDK.trigger).toBeCalledWith("mountChartUI", mockChart)
      expect(mockChart.trigger).toBeCalledWith("mountChartUI")
    })
  })

  describe("unmount", () => {
    beforeEach(() => {
      chartUI.mount(mockElement)
    })

    it("clears element and triggers unmount events", () => {
      chartUI.unmount()

      expect(chartUI.getElement()).toBeNull()
      expect(mockSDK.trigger).toBeCalledWith("unmountChartUI", mockChart)
      expect(mockChart.trigger).toBeCalledWith("unmountChartUI")
    })
  })

  describe("render", () => {
    it("updates rendered timestamp", () => {
      mockChart.getDateWindow.mockReturnValue([1500, 2500])
      
      chartUI.render()

      expect(chartUI.getRenderedAt()).toBe(2500)
    })
  })

  describe("dimensions", () => {
    beforeEach(() => {
      chartUI.mount(mockElement)
    })

    it("returns element dimensions when mounted", () => {
      expect(chartUI.getChartWidth()).toBe(800)
      expect(chartUI.getChartHeight()).toBe(400)
    })

    it("returns default dimensions when not mounted", () => {
      chartUI.unmount()

      expect(chartUI.getChartWidth()).toBe(300)
      expect(chartUI.getChartHeight()).toBe(300)
    })
  })

  describe("event listeners", () => {
    it("inherits listener functionality", () => {
      expect(typeof chartUI.on).toBe("function")
      expect(typeof chartUI.off).toBe("function")
      expect(typeof chartUI.trigger).toBe("function")
    })

    it("registers for chart events", () => {
      expect(mockChart.on).toBeCalledWith("visibleDimensionsChanged", expect.any(Function))
    })
  })
})