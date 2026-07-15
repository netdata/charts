import { renderHook, act } from "@testing-library/react"
import { makeHeatmapPayload, renderHookWithChart, makeTestChart } from "@jest/testUtilities"
import {
  useChart,
  useAttributeValue,
  useForceUpdate,
  useEmpty,
  useTitle,
  useName,
  useIsMinimal,
  useLatestRowValue,
  useLatestDisplayValue,
  useLatestDisplayValueWithUnit,
  useLatestValue,
  getValueByPeriod,
} from "./selectors"

describe("Chart Provider Selectors", () => {
  describe("useChart", () => {
    it("returns chart from context", () => {
      const { result, chart } = renderHookWithChart(() => useChart())

      expect(result.current).toBe(chart)
      expect(typeof result.current.getId).toBe("function")
    })
  })

  describe("useForceUpdate", () => {
    it("returns function that triggers re-render", () => {
      const { result } = renderHook(() => useForceUpdate())

      expect(typeof result.current).toBe("function")
    })

    it("increments counter when called", async () => {
      let renderCount = 0
      const { result } = renderHook(() => {
        renderCount++
        return useForceUpdate()
      })

      const initialRenderCount = renderCount
      await act(async () => {
        result.current()
      })

      expect(renderCount).toBeGreaterThan(initialRenderCount)
    })
  })

  describe("useAttributeValue", () => {
    it("returns attribute value from chart", () => {
      const { result } = renderHookWithChart(() => useAttributeValue("sparkline"), {
        attributes: { sparkline: true },
      })

      expect(result.current).toBe(true)
    })

    it("returns default value when attribute is undefined", () => {
      const { result } = renderHookWithChart(() => useAttributeValue("nonexistent", "default"))

      expect(result.current).toBe("default")
    })

    it("supports nested attributes with fallback values", () => {
      const { result } = renderHookWithChart(
        () => useAttributeValue("drawer.showAdvancedStats", false),
        {
          attributes: { drawer: { showAdvancedStats: true } },
        }
      )

      expect(result.current).toBe(true)
    })

    it("returns fallback for nested attributes when parent missing", () => {
      const { result } = renderHookWithChart(() =>
        useAttributeValue("drawer.showAdvancedStats", false)
      )

      expect(result.current).toBe(false)
    })
  })

  describe("useEmpty", () => {
    it("returns true when chart data is empty", () => {
      const { result } = renderHookWithChart(() => useEmpty(), {
        mockData: { result: { data: [] } },
      })

      expect(result.current).toBe(true)
    })

    it("returns false when chart has data", async () => {
      const { result, chart } = renderHookWithChart(() => useEmpty())

      await act(async () => {
        chart.fetch()
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      expect(result.current).toBe(false)
    })
  })

  describe("useTitle", () => {
    it("returns title from chart attributes", () => {
      const { result } = renderHookWithChart(() => useTitle(), {
        attributes: {
          title: "Test Chart Title",
          contextScope: ["system.cpu"],
        },
      })

      expect(result.current).toBe("Test Chart Title")
    })

    it("prefers explicit title over chartTitleByContextMap value", () => {
      const { result } = renderHookWithChart(() => useTitle(), {
        attributes: {
          title: "Web 01",
          contextScope: ["fping.latency"],
        },
      })

      expect(result.current).toBe("Web 01")
    })

    it("falls back to chartTitleByContextMap when title is empty", () => {
      const { result } = renderHookWithChart(() => useTitle(), {
        attributes: {
          title: "",
          contextScope: ["fping.latency"],
        },
      })

      expect(result.current).toBe("FPing Latency")
    })

    it("returns explicit title when context is not in the map", () => {
      const { result } = renderHookWithChart(() => useTitle(), {
        attributes: {
          title: "My Custom",
          contextScope: ["system.cpu"],
        },
      })

      expect(result.current).toBe("My Custom")
    })
  })

  describe("useName", () => {
    it("returns name from chart attributes", () => {
      const { result } = renderHookWithChart(() => useName(), {
        attributes: {
          name: "Test Chart Name",
          contextScope: ["system.cpu"],
        },
      })

      expect(result.current).toBe("Test Chart Name")
    })

    it("returns contextScope when no name provided", () => {
      const { result } = renderHookWithChart(() => useName(), {
        attributes: {
          contextScope: ["system.cpu", "system.memory"],
        },
      })

      expect(result.current).toBe("system.cpu, system.memory")
    })
  })

  describe("useIsMinimal", () => {
    it("returns true when design flavour is minimal", () => {
      const { result } = renderHookWithChart(() => useIsMinimal(), {
        attributes: { designFlavour: "minimal" },
      })

      expect(result.current).toBe(true)
    })

    it("returns false when design flavour is not minimal", () => {
      const { result } = renderHookWithChart(() => useIsMinimal(), {
        attributes: { designFlavour: "default" },
      })

      expect(result.current).toBe(false)
    })
  })

  describe("getValueByPeriod", () => {
    let chart

    const mockData = [
      [1617946860000, 25, 50, 75],
      [1617946920000, 30, 55, 70],
      [1617946980000, 20, 45, 80],
      [1617947040000, 35, 60, 65],
    ]

    beforeEach(() => {
      const { chart: testChart } = makeTestChart()
      chart = testChart

      jest.spyOn(chart, "getPayload").mockReturnValue({ data: mockData })
      jest.spyOn(chart, "getDimensionIndex").mockReturnValue(0)
      jest.spyOn(chart, "isDimensionVisible").mockReturnValue(true)
      jest.spyOn(chart, "getVisibleDimensionIds").mockReturnValue(["dim1"])
      jest.spyOn(chart, "getRowDimensionValue").mockImplementation((id, row) => {
        const dimIndex = chart.getDimensionIndex(id)
        return row[dimIndex + 1]
      })
    })

    describe("highlight period", () => {
      it("returns null when no highlight range is set", () => {
        chart.updateAttribute("overlays", {})

        const result = getValueByPeriod.highlight({
          chart,
          id: "dim1",
          valueKey: "avg",
        })

        expect(result).toBeNull()
      })

      it("filters data by highlight range and calculates min value", () => {
        const highlightRange = [1617946920, 1617946980]
        chart.updateAttribute("overlays", {
          highlight: { range: highlightRange },
        })

        const result = getValueByPeriod.highlight({
          chart,
          id: "dim1",
          valueKey: "min",
        })

        expect(result).toBe(20)
      })

      it("filters data by highlight range and calculates avg value", () => {
        const highlightRange = [1617946920, 1617946980]
        chart.updateAttribute("overlays", {
          highlight: { range: highlightRange },
        })

        const result = getValueByPeriod.highlight({
          chart,
          id: "dim1",
          valueKey: "avg",
        })

        expect(result).toBe(25)
      })

      it("filters data by highlight range and calculates max value", () => {
        const highlightRange = [1617946920, 1617946980]
        chart.updateAttribute("overlays", {
          highlight: { range: highlightRange },
        })

        const result = getValueByPeriod.highlight({
          chart,
          id: "dim1",
          valueKey: "max",
        })

        expect(result).toBe(30)
      })

      it("returns null when no data matches highlight range", () => {
        const highlightRange = [1617900000, 1617900060]
        chart.updateAttribute("overlays", {
          highlight: { range: highlightRange },
        })

        const result = getValueByPeriod.highlight({
          chart,
          id: "dim1",
          valueKey: "avg",
        })

        expect(result).toBeNull()
      })

      it("handles dimension not visible by using first visible dimension", () => {
        jest.spyOn(chart, "isDimensionVisible").mockReturnValue(false)
        jest.spyOn(chart, "getVisibleDimensionIds").mockReturnValue(["visibleDim"])
        jest.spyOn(chart, "getDimensionIndex").mockReturnValue(1)

        const highlightRange = [1617946860, 1617947040]
        chart.updateAttribute("overlays", {
          highlight: { range: highlightRange },
        })

        const result = getValueByPeriod.highlight({
          chart,
          id: "hiddenDim",
          valueKey: "avg",
        })

        expect(result).toBe(52.5)
      })
    })
  })

  describe("display values", () => {
    it("refreshes latest values for successful fetches instead of render requests", () => {
      jest.useFakeTimers()
      const { chart } = makeTestChart()
      jest.spyOn(chart, "getPayload").mockReturnValue({ all: [[0, 11]], data: [[0, 11]] })
      jest.spyOn(chart, "isDimensionVisible").mockReturnValue(true)
      const getDimensionValue = jest.spyOn(chart, "getDimensionValue").mockReturnValue(11)

      const { result } = renderHookWithChart(() => useLatestValue("dim1"), { chart })

      expect(result.current).toBe(11)
      getDimensionValue.mockClear()

      act(() => {
        for (let i = 0; i < 20; i++) chart.trigger("render")
        jest.runOnlyPendingTimers()
      })

      expect(getDimensionValue).not.toHaveBeenCalled()

      act(() => chart.trigger("successFetch"))

      expect(getDimensionValue).toHaveBeenCalledTimes(1)
      jest.useRealTimers()
    })

    it("refreshes complete latest rows for successful fetches instead of render requests", () => {
      jest.useFakeTimers()
      const { chart } = makeTestChart()
      jest.spyOn(chart, "getPayload").mockReturnValue({ all: [[0, 11]], data: [[0, 11]] })
      jest.spyOn(chart, "getVisibleDimensionIds").mockReturnValue(["dim1"])
      const getDimensionValue = jest.spyOn(chart, "getDimensionValue").mockReturnValue(11)
      jest.spyOn(chart, "selectDimensionColor").mockReturnValue("#123456")

      const { result } = renderHookWithChart(() => useLatestRowValue(), { chart })

      act(() => {
        for (let i = 0; i < 20; i++) chart.trigger("render")
        jest.runOnlyPendingTimers()
      })

      expect(result.current).toBeNull()
      expect(getDimensionValue).not.toHaveBeenCalled()

      act(() => chart.trigger("successFetch"))

      expect(result.current).toEqual([{ label: "dim1", value: 11, color: "#123456" }])
      expect(getDimensionValue).toHaveBeenCalledTimes(1)
      jest.useRealTimers()
    })

    it("keeps magnitude retrieval separate from signed atomic presentation", async () => {
      const payload = makeHeatmapPayload(["bytes"], [[-1536]])
      payload.view.chart_type = "line"
      payload.view.units = "By"
      payload.view.dimensions.grouped_by = []
      payload.view.dimensions.units = ["By"]

      const { chart } = makeTestChart({
        attributes: {
          groupBy: [],
          selectedDimensions: [],
          selectedLegendDimensions: [],
        },
      })

      chart.doneFetch(payload)
      await new Promise(resolve => setTimeout(resolve, 0))

      const { result } = renderHookWithChart(
        () => ({
          magnitude: useLatestValue("bytes", { allowNull: true }),
          display: useLatestDisplayValue("bytes", { allowNull: true }),
          formatted: useLatestDisplayValueWithUnit("bytes"),
        }),
        { chart }
      )

      expect(result.current.magnitude).toBe(1536)
      expect(result.current.display).toBe(-1536)
      expect(result.current.formatted.convertedValue).toBe("-1.5")
      expect(result.current.formatted.convertedUnit).toBe("KiB")
    })
  })
})
