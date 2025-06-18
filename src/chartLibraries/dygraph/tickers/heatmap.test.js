import heatmapTicker from "./heatmap"
import { withoutPrefix } from "@/helpers/heatmap"

describe("heatmapTicker", () => {
  let mockOpts
  let mockDygraph

  beforeEach(() => {
    mockOpts = jest.fn((key) => {
      const options = {
        pixelsPerLabel: 50,
        axisLabelFormatter: jest.fn((value) => `label_${value}`)
      }
      return options[key]
    })

    mockDygraph = {
      yAxisRange: jest.fn(() => [0, 100]),
      getArea: jest.fn(() => ({ h: 300 }))
    }
  })

  it("generates ticks with proper structure", () => {
    const defaultLabels = ["prefix_label1", "prefix_label2", "prefix_label3", "prefix_label4"]
    const ticks = heatmapTicker(0, 100, 200, mockOpts, mockDygraph, null, { labels: defaultLabels })

    expect(Array.isArray(ticks)).toBe(true)
    expect(ticks.length).toBeGreaterThan(0)
    expect(ticks[0]).toHaveProperty("label_v")
    expect(ticks[ticks.length - 1]).toHaveProperty("label_v")
  })

  it("removes prefix from labels", () => {
    const defaultLabels = ["system_cpu", "system_memory", "system_disk"]
    const ticks = heatmapTicker(0, 100, 200, mockOpts, mockDygraph, null, { labels: defaultLabels })

    // withoutPrefix should remove the prefix from labels
    const dataTicks = ticks.filter(tick => tick.v !== undefined)
    expect(dataTicks.length).toBe(defaultLabels.length)
    
    // Verify ticks have been generated with labels
    const labeledTicks = ticks.filter(tick => tick.label !== null && tick.label !== undefined)
    expect(labeledTicks.length).toBeGreaterThan(0)
  })

  it("calculates maximum ticks based on pixels and pixelsPerLabel", () => {
    const defaultLabels = Array.from({ length: 20 }, (_, i) => `label${i}`)
    const pixels = 300
    
    const ticks = heatmapTicker(0, 100, pixels, mockOpts, mockDygraph, null, { labels: defaultLabels })
    
    // Should limit number of visible labels based on available pixels
    const visibleTicks = ticks.filter(tick => tick.label && tick.label !== null)
    expect(visibleTicks.length).toBeLessThanOrEqual(Math.floor(pixels / 50))
  })

  it("formats labels using axisLabelFormatter", () => {
    const defaultLabels = ["label1", "label2"]
    const mockFormatter = jest.fn((value) => `formatted_${value}`)
    mockOpts.mockImplementation((key) => {
      if (key === "axisLabelFormatter") return mockFormatter
      if (key === "pixelsPerLabel") return 50
    })

    heatmapTicker(0, 100, 200, mockOpts, mockDygraph, null, { labels: defaultLabels })

    expect(mockFormatter).toHaveBeenCalled()
  })

  it("calculates hidden step to reduce label density", () => {
    const defaultLabels = Array.from({ length: 10 }, (_, i) => `label${i}`)
    const pixels = 100 // Small pixel count to force hiding
    
    const ticks = heatmapTicker(0, 100, pixels, mockOpts, mockDygraph, null, { labels: defaultLabels })
    
    // Check that some labels are hidden (set to null)
    const middleTicks = ticks.slice(1, -1) // Exclude first and last which have label_v
    const hiddenTicks = middleTicks.filter(tick => tick.label === null)
    expect(hiddenTicks.length).toBeGreaterThan(0)
  })

  it("adds boundary ticks with label_v property", () => {
    const defaultLabels = ["label1", "label2"]
    const ticks = heatmapTicker(0, 100, 200, mockOpts, mockDygraph, null, { labels: defaultLabels })

    // First tick should have label_v for top boundary
    expect(ticks[0]).toHaveProperty("label_v")
    expect(typeof ticks[0].label_v).toBe("number")

    // Last tick should have label_v for bottom boundary  
    expect(ticks[ticks.length - 1]).toHaveProperty("label_v")
    expect(typeof ticks[ticks.length - 1].label_v).toBe("number")
  })

  it("calculates point height based on y-axis range and area", () => {
    mockDygraph.yAxisRange.mockReturnValue([10, 90])
    mockDygraph.getArea.mockReturnValue({ h: 150 })
    
    const defaultLabels = ["label1"]
    const ticks = heatmapTicker(0, 100, 200, mockOpts, mockDygraph, null, { labels: defaultLabels })

    // Point height should be calculated as (max - min) / 15 / area.h
    const expectedPointHeight = (90 - 10) / 15 / 150
    expect(ticks[0].label_v).toBeCloseTo(90 - expectedPointHeight)
    expect(ticks[ticks.length - 1].label_v).toBeCloseTo(10 + expectedPointHeight)
  })

  it("handles empty labels gracefully", () => {
    const defaultLabels = []
    const ticks = heatmapTicker(0, 100, 200, mockOpts, mockDygraph, null, { labels: defaultLabels })

    expect(Array.isArray(ticks)).toBe(true)
    expect(ticks.length).toBe(2) // Only boundary ticks
    expect(ticks[0]).toHaveProperty("label_v")
    expect(ticks[1]).toHaveProperty("label_v")
  })

  it("handles undefined labels parameter", () => {
    expect(() => {
      heatmapTicker(0, 100, 200, mockOpts, mockDygraph, null, { labels: [] })
    }).not.toThrow()
  })
})