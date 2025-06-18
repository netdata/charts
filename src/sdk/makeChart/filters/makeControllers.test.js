import makeControllers from "./makeControllers"
import { makeTestChart } from "@/testUtilities"

describe("makeControllers", () => {
  let chart
  let controllers

  beforeEach(() => {
    const { chart: testChart } = makeTestChart()
    chart = testChart
    controllers = makeControllers(chart)
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
    chart.updateAttribute("aggregationMethod", "avg")
    const spy = jest.spyOn(chart, "updateAttributes")
    const triggerSpy = jest.spyOn(chart, "trigger")
    
    controllers.updateAggregationMethodAttribute("sum")
    
    expect(spy).toHaveBeenCalledWith({
      aggregationMethod: "sum",
      processing: true
    })
    expect(triggerSpy).toHaveBeenCalledWith("fetch", { processing: true })
  })

  it("updateAggregationMethodAttribute skips when value unchanged", () => {
    chart.updateAttribute("aggregationMethod", "avg")
    const spy = jest.spyOn(chart, "updateAttributes")
    
    controllers.updateAggregationMethodAttribute("avg")
    
    expect(spy).not.toHaveBeenCalled()
  })

  it("updatePostAggregationMethodAttribute updates when value changes", () => {
    const spy = jest.spyOn(chart, "updateAttributes")
    
    controllers.updatePostAggregationMethodAttribute("sum")
    
    expect(spy).toHaveBeenCalledWith({
      postAggregationMethod: "sum",
      processing: true
    })
  })

  it("updateContextScopeAttribute updates when value changes", () => {
    const spy = jest.spyOn(chart, "updateAttributes")
    
    controllers.updateContextScopeAttribute("new-context")
    
    expect(spy).toHaveBeenCalledWith({
      contextScope: ["new-context"],
      processing: true
    })
  })

  it("updateContextScopeAttribute skips when value unchanged", () => {
    chart.updateAttribute("contextScope", ["same-context"])
    const spy = jest.spyOn(chart, "updateAttributes")
    
    controllers.updateContextScopeAttribute("same-context")
    
    expect(spy).not.toHaveBeenCalled()
  })

  it("updateTimeAggregationMethodAttribute formats value with alias", () => {
    const spy = jest.spyOn(chart, "updateAttributes")
    
    controllers.updateTimeAggregationMethodAttribute({
      alias: "_avg",
      method: "time"
    })
    
    expect(spy).toHaveBeenCalledWith({
      groupingMethod: "time_avg",
      processing: true
    })
  })

  it("updateTimeAggregationMethodAttribute uses method without alias", () => {
    const spy = jest.spyOn(chart, "updateAttributes")
    
    controllers.updateTimeAggregationMethodAttribute({
      method: "time"
    })
    
    expect(spy).toHaveBeenCalledWith({
      groupingMethod: "time",
      processing: true
    })
  })

  it("toggleFullscreen toggles fullscreen state", () => {
    const spy = jest.spyOn(chart, "updateAttribute")
    
    controllers.toggleFullscreen()
    
    expect(spy).toHaveBeenCalledWith("fullscreen", true)
  })

  it("removePristine updates pristine attribute", () => {
    const spy = jest.spyOn(chart, "updateAttribute")
    
    controllers.removePristine()
    
    expect(spy).toHaveBeenCalledWith("pristine", {})
  })

  describe("updateGroupByAttribute", () => {
    it("updates groupBy with allowed values", () => {
      const selected = [
        { value: "node", isLabel: false },
        { value: "instance", isLabel: false }
      ]
      
      const spy = jest.spyOn(chart, "updateAttributes")
      const fetchSpy = jest.spyOn(chart, "fetch")
      
      controllers.updateGroupByAttribute(selected)
      
      expect(spy).toHaveBeenCalledWith({
        groupByLabel: [],
        groupBy: ["node", "instance"],
        processing: true
      })
      expect(fetchSpy).toHaveBeenCalledWith({ processing: true })
    })
  })

  describe("updateNodesAttribute", () => {
    it("updates selectedNodes", () => {
      const selected = [
        { value: "node1", isInstance: false },
        { value: "node2", isInstance: false }
      ]
      
      const spy = jest.spyOn(chart, "updateAttributes")
      const triggerSpy = jest.spyOn(chart, "trigger")
      
      controllers.updateNodesAttribute(selected)
      
      expect(spy).toHaveBeenCalledWith({
        selectedNodes: ["node1", "node2"],
        processing: true
      })
      expect(triggerSpy).toHaveBeenCalledWith("fetch", { processing: true })
    })
  })

  describe("updateDimensionsAttribute", () => {
    it("updates selectedDimensions", () => {
      const selected = [
        { value: "cpu" },
        { value: "memory" }
      ]
      
      const spy = jest.spyOn(chart, "updateAttributes")
      const triggerSpy = jest.spyOn(chart, "trigger")
      
      controllers.updateDimensionsAttribute(selected)
      
      expect(spy).toHaveBeenCalledWith({
        selectedDimensions: ["cpu", "memory"],
        processing: true
      })
      expect(triggerSpy).toHaveBeenCalledWith("fetch", { processing: true })
    })
  })
})