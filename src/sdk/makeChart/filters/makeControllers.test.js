import makeControllers from "./makeControllers"

jest.mock("@/sdk/makeLog", () => jest.fn(() => jest.fn()))
jest.mock("@/helpers/deepEqual", () => jest.fn())
jest.mock("@/helpers/heatmap", () => ({
  isHeatmap: jest.fn()
}))
jest.mock("./getInitialAttributes", () => ({
  __esModule: true,
  default: jest.fn(() => ({ someAttribute: "value" })),
  stackedAggregations: { sum: true, count: true }
}))
jest.mock("@/sdk/pristine", () => ({
  __esModule: true,
  default: { reset: jest.fn() },
  pristineKey: "pristine"
}))

describe("makeControllers", () => {
  let mockChart
  let controllers

  let deepEqual, isHeatmap, getInitialAttributes, pristine
  
  beforeEach(() => {
    deepEqual = require("@/helpers/deepEqual")
    isHeatmap = require("@/helpers/heatmap").isHeatmap
    getInitialAttributes = require("./getInitialAttributes").default
    pristine = require("@/sdk/pristine").default
    
    deepEqual.mockReturnValue(false)
    isHeatmap.mockReturnValue(false)
    getInitialAttributes.mockReturnValue({ someAttribute: "value" })
    pristine.reset.mockClear()
    
    mockChart = {
      getAttribute: jest.fn(),
      getAttributes: jest.fn(() => ({ 
        pristine: { chartType: "line" },
        selectedDimensions: [],
        groupBy: ["dimension"],
        dimensionsOnNonDimensionGrouping: null,
        dimensionIds: [],
        chartType: "line",
        chartLibrary: "dygraph",
        selectedChartType: null,
        selectedNodes: [],
        selectedInstances: [],
        selectedLabels: [],
        contextScope: ["system"],
        groupingMethod: "average",
        aggregationMethod: "average",
        postAggregationMethod: "average",
        postGroupBy: [],
        postGroupByLabel: [],
        groupByLabel: [],
        selectedNodeLabelsFilter: [],
        fullscreen: false
      })),
      updateAttribute: jest.fn(),
      updateAttributes: jest.fn(),
      trigger: jest.fn(),
      fetch: jest.fn(() => new Promise(() => {})),
      getUI: jest.fn(() => ({ unmount: jest.fn() })),
      setUI: jest.fn(),
      attributeListeners: { trigger: jest.fn() },
      sdk: { 
        makeChartUI: jest.fn(() => ({})),
        trigger: jest.fn()
      },
      ui: {}
    }

    controllers = makeControllers(mockChart)
  })

  it("returns controller functions", () => {
    expect(controllers).toHaveProperty("updateGroupByAttribute")
    expect(controllers).toHaveProperty("updatePostGroupByAttribute")
    expect(controllers).toHaveProperty("updateChartTypeAttribute")
    expect(controllers).toHaveProperty("updateNodesAttribute")
    expect(controllers).toHaveProperty("updateInstancesAttribute")
    expect(controllers).toHaveProperty("updateDimensionsAttribute")
    expect(controllers).toHaveProperty("updateLabelsAttribute")
    expect(controllers).toHaveProperty("updateAggregationMethodAttribute")
    expect(controllers).toHaveProperty("updatePostAggregationMethodAttribute")
    expect(controllers).toHaveProperty("updateTimeAggregationMethodAttribute")
    expect(controllers).toHaveProperty("updateContextScopeAttribute")
    expect(controllers).toHaveProperty("updateNodeLabelsFilter")
    expect(controllers).toHaveProperty("resetPristine")
    expect(controllers).toHaveProperty("removePristine")
    expect(controllers).toHaveProperty("toggleFullscreen")
  })

  it("updateAggregationMethodAttribute updates when value changes", () => {
    mockChart.getAttribute.mockReturnValue("avg")
    
    controllers.updateAggregationMethodAttribute("sum")
    
    expect(mockChart.updateAttributes).toHaveBeenCalledWith({
      aggregationMethod: "sum",
      processing: true
    })
    expect(mockChart.trigger).toHaveBeenCalledWith("fetch", { processing: true })
  })

  it("updateAggregationMethodAttribute skips when value unchanged", () => {
    mockChart.getAttribute.mockReturnValue("avg")
    
    controllers.updateAggregationMethodAttribute("avg")
    
    expect(mockChart.updateAttributes).not.toHaveBeenCalled()
  })

  it("updatePostAggregationMethodAttribute updates when value changes", () => {
    mockChart.getAttribute.mockReturnValue("avg")
    
    controllers.updatePostAggregationMethodAttribute("sum")
    
    expect(mockChart.updateAttributes).toHaveBeenCalledWith({
      postAggregationMethod: "sum",
      processing: true
    })
  })

  it("updateContextScopeAttribute updates when value changes", () => {
    mockChart.getAttribute.mockReturnValue(["old-context"])
    
    controllers.updateContextScopeAttribute("new-context")
    
    expect(mockChart.updateAttributes).toHaveBeenCalledWith({
      contextScope: ["new-context"],
      processing: true
    })
  })

  it("updateContextScopeAttribute skips when value unchanged", () => {
    mockChart.getAttribute.mockReturnValue(["same-context"])
    
    controllers.updateContextScopeAttribute("same-context")
    
    expect(mockChart.updateAttributes).not.toHaveBeenCalled()
  })

  it("updateTimeAggregationMethodAttribute formats value with alias", () => {
    mockChart.getAttribute.mockReturnValue("old-method")
    
    controllers.updateTimeAggregationMethodAttribute({
      alias: "_avg",
      method: "time"
    })
    
    expect(mockChart.updateAttributes).toHaveBeenCalledWith({
      groupingMethod: "time_avg",
      processing: true
    })
  })

  it("updateTimeAggregationMethodAttribute uses method without alias", () => {
    mockChart.getAttribute.mockReturnValue("old-method")
    
    controllers.updateTimeAggregationMethodAttribute({
      method: "time"
    })
    
    expect(mockChart.updateAttributes).toHaveBeenCalledWith({
      groupingMethod: "time",
      processing: true
    })
  })

  it("toggleFullscreen toggles fullscreen state", () => {
    mockChart.getAttribute.mockReturnValue(false)
    
    controllers.toggleFullscreen()
    
    expect(mockChart.updateAttribute).toHaveBeenCalledWith("fullscreen", true)
  })

  it("removePristine updates pristine attribute", () => {
    mockChart.getAttribute.mockReturnValue({ some: "data" })
    
    controllers.removePristine()
    
    expect(mockChart.updateAttribute).toHaveBeenCalledWith("pristine", {})
  })

  describe("updateGroupByAttribute", () => {
    it("updates groupBy with allowed values", () => {
      const selected = [
        { value: "node", isLabel: false },
        { value: "instance", isLabel: false }
      ]
      
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "groupBy") return ["dimension"]
        if (key === "groupByLabel") return []
        return null
      })
      
      controllers.updateGroupByAttribute(selected)
      
      expect(mockChart.updateAttributes).toHaveBeenCalledWith({
        groupByLabel: [],
        groupBy: ["node", "instance"],
        processing: true
      })
      expect(mockChart.fetch).toHaveBeenCalledWith({ processing: true })
    })

    it("filters out disallowed values", () => {
      const selected = [
        { value: "node", isLabel: false },
        { value: "invalid", isLabel: false }
      ]
      
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "groupBy") return ["dimension"]
        if (key === "groupByLabel") return []
        return null
      })
      
      controllers.updateGroupByAttribute(selected)
      
      expect(mockChart.updateAttributes).toHaveBeenCalledWith({
        groupByLabel: [],
        groupBy: ["node"],
        processing: true
      })
    })

    it("adds label grouping when labels are selected", () => {
      const selected = [
        { value: "node", isLabel: false },
        { value: "env", isLabel: true }
      ]
      
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "groupBy") return ["dimension"]
        if (key === "groupByLabel") return []
        return null
      })
      
      controllers.updateGroupByAttribute(selected)
      
      expect(mockChart.updateAttributes).toHaveBeenCalledWith({
        groupByLabel: ["env"],
        groupBy: ["node", "label"],
        processing: true
      })
    })

    it("defaults to dimension when no valid selections", () => {
      const selected = [
        { value: "invalid", isLabel: false }
      ]
      
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "groupBy") return ["node"]
        if (key === "groupByLabel") return []
        return null
      })
      
      controllers.updateGroupByAttribute(selected)
      
      expect(mockChart.updateAttributes).toHaveBeenCalledWith({
        groupByLabel: [],
        groupBy: ["dimension"],
        processing: true
      })
    })

    it("skips update when values are unchanged", () => {
      deepEqual.mockReturnValue(true)
      
      const selected = [{ value: "dimension", isLabel: false }]
      
      controllers.updateGroupByAttribute(selected)
      
      expect(mockChart.updateAttributes).not.toHaveBeenCalled()
    })

  })

  describe("updatePostGroupByAttribute", () => {
    it("updates postGroupBy with selected values", () => {
      const selected = [
        { value: "node", isLabel: false },
        { value: "env", isLabel: true }
      ]
      
      controllers.updatePostGroupByAttribute(selected)
      
      expect(mockChart.updateAttributes).toHaveBeenCalledWith({
        postGroupByLabel: ["env"],
        postGroupBy: ["node", "label"],
        processing: true
      })
    })

    it("skips update when values are unchanged", () => {
      deepEqual.mockReturnValue(true)
      
      const selected = [{ value: "node", isLabel: false }]
      
      controllers.updatePostGroupByAttribute(selected)
      
      expect(mockChart.updateAttributes).not.toHaveBeenCalled()
    })
  })

  describe("updateChartTypeAttribute", () => {
    it("updates to custom chart type not in chartLibraries", () => {
      controllers.updateChartTypeAttribute("custom")
      
      expect(mockChart.updateAttributes).toHaveBeenCalledWith({
        chartLibrary: "dygraph",
        selectedChartType: "custom",
        chartType: "custom",
        processing: true
      })
    })

    it("remounts UI when switching from non-dygraph to custom type", () => {
      const unmountSpy = jest.fn()
      mockChart.getUI.mockReturnValue({ unmount: unmountSpy })
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "chartLibrary") return "table"
        return null
      })
      
      controllers.updateChartTypeAttribute("custom")
      
      expect(unmountSpy).toHaveBeenCalled()
      expect(mockChart.setUI).toHaveBeenCalled()
    })

    it("does not remount UI when already using dygraph", () => {
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "chartLibrary") return "dygraph"
        return null
      })
      
      controllers.updateChartTypeAttribute("custom")
      
      expect(mockChart.getUI().unmount).not.toHaveBeenCalled()
    })

    it("updates to chart library type", () => {
      const unmountSpy = jest.fn()
      mockChart.getUI.mockReturnValue({ unmount: unmountSpy })
      
      controllers.updateChartTypeAttribute("table")
      
      expect(mockChart.updateAttributes).toHaveBeenCalledWith({
        chartLibrary: "table",
        processing: true
      })
      expect(unmountSpy).toHaveBeenCalled()
      expect(mockChart.setUI).toHaveBeenCalled()
    })

    it("sets dimensionsSort for heatmap chart types", () => {
      isHeatmap.mockReturnValue(true)
      
      controllers.updateChartTypeAttribute("table")
      
      expect(mockChart.updateAttributes).toHaveBeenCalledWith({
        chartLibrary: "table",
        processing: true,
        dimensionsSort: "default"
      })
    })


    it("returns early when groupBy changes for heatmap", () => {
      isHeatmap.mockReturnValue(true)
      deepEqual.mockReturnValue(false)
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "groupBy") return ["node"]
        return null
      })
      
      controllers.updateChartTypeAttribute("table")
      
      expect(mockChart.trigger).not.toHaveBeenCalledWith("fetch", { processing: true })
    })

    it("continues to fetch when groupBy unchanged for heatmap", () => {
      isHeatmap.mockReturnValue(true)
      deepEqual.mockReturnValue(true)
      
      controllers.updateChartTypeAttribute("table")
      
      expect(mockChart.trigger).toHaveBeenCalledWith("fetch", { processing: true })
    })
  })

  describe("updateNodesAttribute", () => {
    it("updates selectedNodes and selectedInstances", () => {
      const selected = [
        { value: "node1", isInstance: false },
        { value: "instance1", isInstance: true },
        { value: "node2", isInstance: false }
      ]
      
      controllers.updateNodesAttribute(selected)
      
      expect(mockChart.updateAttributes).toHaveBeenCalledWith({
        selectedNodes: ["node1", "node2"],
        processing: true
      })
      expect(mockChart.updateAttributes).toHaveBeenCalledWith({
        selectedInstances: ["instance1"],
        processing: true
      })
      expect(mockChart.trigger).toHaveBeenCalledWith("fetch", { processing: true })
    })

    it("skips update when nodes unchanged", () => {
      deepEqual.mockReturnValue(true)
      
      const selected = [{ value: "node1", isInstance: false }]
      
      controllers.updateNodesAttribute(selected)
      
      expect(mockChart.trigger).not.toHaveBeenCalledWith("fetch", { processing: true })
    })

    it("updates only instances when nodes unchanged", () => {
      deepEqual
        .mockReturnValueOnce(true)  // nodes unchanged
        .mockReturnValueOnce(false) // instances changed
      
      const selected = [{ value: "instance1", isInstance: true }]
      
      controllers.updateNodesAttribute(selected)
      
      expect(mockChart.updateAttributes).toHaveBeenCalledWith({
        selectedInstances: ["instance1"],
        processing: true
      })
      expect(mockChart.trigger).toHaveBeenCalledWith("fetch", { processing: true })
    })
  })

  describe("updateNodeLabelsFilter", () => {
    it("updates with new labels", () => {
      const selectedLabels = ["env:prod", "team:backend"]
      
      controllers.updateNodeLabelsFilter(selectedLabels)
      
      expect(mockChart.updateAttributes).toHaveBeenCalledWith({
        selectedNodeLabelsFilter: selectedLabels,
        processing: true
      })
      expect(mockChart.trigger).toHaveBeenCalledWith("fetch", { processing: true })
    })

    it("calls function with current value", () => {
      const currentLabels = ["env:dev"]
      const updaterFunction = jest.fn().mockReturnValue(["env:prod"])
      
      mockChart.getAttribute.mockImplementation(key => {
        if (key === "selectedNodeLabelsFilter") return currentLabels
        return null
      })
      
      controllers.updateNodeLabelsFilter(updaterFunction)
      
      expect(updaterFunction).toHaveBeenCalledWith(currentLabels)
      expect(mockChart.updateAttributes).toHaveBeenCalledWith({
        selectedNodeLabelsFilter: ["env:prod"],
        processing: true
      })
    })

    it("skips update when labels unchanged", () => {
      deepEqual.mockReturnValue(true)
      
      controllers.updateNodeLabelsFilter(["env:prod"])
      
      expect(mockChart.updateAttributes).not.toHaveBeenCalled()
    })
  })

  describe("updateInstancesAttribute", () => {
    it("updates selectedInstances", () => {
      const selected = [
        { value: "instance1" },
        { value: "instance2" }
      ]
      
      controllers.updateInstancesAttribute(selected)
      
      expect(mockChart.updateAttributes).toHaveBeenCalledWith({
        selectedInstances: ["instance1", "instance2"],
        processing: true
      })
      expect(mockChart.trigger).toHaveBeenCalledWith("fetch", { processing: true })
    })

    it("skips update when instances unchanged", () => {
      deepEqual.mockReturnValue(true)
      
      const selected = [{ value: "instance1" }]
      
      controllers.updateInstancesAttribute(selected)
      
      expect(mockChart.updateAttributes).not.toHaveBeenCalled()
    })
  })

  describe("updateDimensionsAttribute", () => {
    it("updates selectedDimensions", () => {
      const selected = [
        { value: "cpu" },
        { value: "memory" }
      ]
      
      controllers.updateDimensionsAttribute(selected)
      
      expect(mockChart.updateAttributes).toHaveBeenCalledWith({
        selectedDimensions: ["cpu", "memory"],
        processing: true
      })
      expect(mockChart.trigger).toHaveBeenCalledWith("fetch", { processing: true })
    })

    it("skips update when dimensions unchanged", () => {
      deepEqual.mockReturnValue(true)
      
      const selected = [{ value: "cpu" }]
      
      controllers.updateDimensionsAttribute(selected)
      
      expect(mockChart.updateAttributes).not.toHaveBeenCalled()
    })
  })

  describe("updateLabelsAttribute", () => {
    it("updates selectedLabels", () => {
      const selected = [
        { value: "env:prod" },
        { value: "team:backend" }
      ]
      
      controllers.updateLabelsAttribute(selected)
      
      expect(mockChart.updateAttributes).toHaveBeenCalledWith({
        selectedLabels: ["env:prod", "team:backend"],
        processing: true
      })
      expect(mockChart.trigger).toHaveBeenCalledWith("fetch", { processing: true })
    })

    it("skips update when labels unchanged", () => {
      deepEqual.mockReturnValue(true)
      
      const selected = [{ value: "env:prod" }]
      
      controllers.updateLabelsAttribute(selected)
      
      expect(mockChart.updateAttributes).not.toHaveBeenCalled()
    })
  })

  describe("resetPristine", () => {
    it("resets pristine state and triggers events", () => {
      const currentAttributes = {
        pristine: { chartType: "line", chartLibrary: "dygraph" },
        chartLibrary: "table",
        someKey: "someValue"
      }
      
      mockChart.getAttributes.mockReturnValue(currentAttributes)
      
      controllers.resetPristine()
      
      expect(pristine.reset).toHaveBeenCalledWith(currentAttributes)
      expect(mockChart.attributeListeners.trigger).toHaveBeenCalledWith(
        "pristine", 
        currentAttributes.pristine, 
        { chartType: "line", chartLibrary: "dygraph" }
      )
      expect(mockChart.sdk.trigger).toHaveBeenCalledWith(
        "pristineChanged", 
        mockChart, 
        "pristine", 
        currentAttributes.pristine, 
        { chartType: "line", chartLibrary: "dygraph" }
      )
    })

    it("remounts UI when chart library has changed", () => {
      const unmountSpy = jest.fn()
      mockChart.getUI.mockReturnValue({ unmount: unmountSpy })
      const currentAttributes = {
        pristine: { chartLibrary: "dygraph" },
        chartLibrary: "table"
      }
      
      mockChart.getAttributes.mockReturnValue(currentAttributes)
      
      controllers.resetPristine()
      
      expect(unmountSpy).toHaveBeenCalled()
      expect(mockChart.setUI).toHaveBeenCalled()
      expect(mockChart.trigger).toHaveBeenCalledWith("fetch", { processing: true })
    })

    it("does not remount UI when chart library unchanged", () => {
      const currentAttributes = {
        pristine: { chartLibrary: "dygraph" },
        chartLibrary: "dygraph"
      }
      
      mockChart.getAttributes.mockReturnValue(currentAttributes)
      
      controllers.resetPristine()
      
      expect(mockChart.getUI().unmount).not.toHaveBeenCalled()
    })
  })

  describe("updateTimeAggregationMethodAttribute", () => {
    it("skips update when value unchanged", () => {
      mockChart.getAttribute.mockReturnValue("time_avg")
      
      controllers.updateTimeAggregationMethodAttribute({
        alias: "_avg",
        method: "time"
      })
      
      expect(mockChart.updateAttributes).not.toHaveBeenCalled()
    })
  })

  describe("edge cases", () => {
    it("handles toggleFullscreen from true to false", () => {
      mockChart.getAttribute.mockReturnValue(true)
      
      controllers.toggleFullscreen()
      
      expect(mockChart.updateAttribute).toHaveBeenCalledWith("fullscreen", false)
    })

  })
})