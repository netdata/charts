import { renderHook, act } from "@testing-library/react"
import { renderHookWithChart } from "@jest/testUtilities"
import {
  useChart,
  useAttributeValue,
  useForceUpdate,
  useEmpty,
  useTitle,
  useName,
  useIsMinimal,
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
        testChartOptions: { attributes: { sparkline: true } }
      })

      expect(result.current).toBe(true)
    })
  })

  describe("useEmpty", () => {
    it("returns true when chart data is empty", () => {
      const { result } = renderHookWithChart(() => useEmpty(), {
        testChartOptions: { mockData: { result: { data: [] } } }
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
        testChartOptions: { 
          attributes: { 
            title: "Test Chart Title",
            contextScope: ["system.cpu"]
          }
        }
      })

      expect(result.current).toBe("Test Chart Title")
    })
  })

  describe("useName", () => {
    it("returns name from chart attributes", () => {
      const { result } = renderHookWithChart(() => useName(), {
        testChartOptions: { 
          attributes: { 
            name: "Test Chart Name",
            contextScope: ["system.cpu"]
          }
        }
      })

      expect(result.current).toBe("Test Chart Name")
    })

    it("returns contextScope when no name provided", () => {
      const { result } = renderHookWithChart(() => useName(), {
        testChartOptions: { 
          attributes: { 
            contextScope: ["system.cpu", "system.memory"]
          }
        }
      })

      expect(result.current).toBe("system.cpu, system.memory")
    })
  })

  describe("useIsMinimal", () => {
    it("returns true when design flavour is minimal", () => {
      const { result } = renderHookWithChart(() => useIsMinimal(), {
        testChartOptions: { attributes: { designFlavour: "minimal" } }
      })

      expect(result.current).toBe(true)
    })

    it("returns false when design flavour is not minimal", () => {
      const { result } = renderHookWithChart(() => useIsMinimal(), {
        testChartOptions: { attributes: { designFlavour: "standard" } }
      })

      expect(result.current).toBe(false)
    })
  })
})