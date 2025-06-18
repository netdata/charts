import { makeTestChart } from "@/testUtilities"
import point from "./point"

describe("point overlay", () => {
  it("handles overlay access", () => {
    const { chart } = makeTestChart()
    
    chart.getAttribute = (key) => {
      if (key === "overlays") {
        return {
          "test-point": {
            row: 5
          }
        }
      }
      return {}
    }
    
    const chartUI = { 
      chart,
      getDygraph: () => ({
        getArea: () => ({ h: 100 }),
        canvas_ctx_: {
          save: () => {},
          restore: () => {},
          setLineDash: () => {},
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          stroke: () => {},
          strokeStyle: "",
          lineWidth: 0
        }
      })
    }
    
    expect(() => point(chartUI, "test-point")).not.toThrow()
  })

  it("handles missing overlay", () => {
    const { chart } = makeTestChart()
    
    chart.getAttribute = () => ({})
    
    const chartUI = { chart }
    
    expect(() => point(chartUI, "missing-overlay")).toThrow()
  })
})