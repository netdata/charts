import camelizePayload from "./camelizePayload"

describe("camelizePayload", () => {
  it("handles minimal payload", () => {
    const payload = {
      result: {
        data: [[1000, 1, 2]],
        labels: ["time", "cpu", "memory"],
        point: { value: 0 },
      },
    }

    const result = camelizePayload(payload)

    expect(result).toHaveProperty("result")
    expect(result.result).toHaveProperty("data")
    expect(result.result).toHaveProperty("labels")
    expect(result.result.labels).toContain("ANOMALY_RATE")
    expect(result.result.labels).toContain("ANNOTATIONS")
  })

  it("handles empty payload", () => {
    const payload = {
      result: {
        data: [],
        labels: [],
        point: { value: 0 },
      },
    }

    expect(() => camelizePayload(payload)).not.toThrow()
  })

  it("processes chart metadata", () => {
    const payload = {
      view: {
        title: "Test Chart",
        chart_type: "line",
        units: "bytes",
      },
      result: {
        data: [],
        labels: [],
        point: { value: 0 },
      },
    }

    const result = camelizePayload(payload)

    expect(result.title).toBe("Test Chart")
    expect(result.chartType).toBe("line")
    expect(result.units).toEqual(["By"])
    expect(result.stepPlot).toBe(false)
  })

  it("aliases chart and dimension units before they are stored", () => {
    const payload = {
      view: {
        chart_type: "line",
        units: ["KiB", "seconds", "milliseconds", "percent", "percentage", "kilobits/s"],
        dimensions: {
          grouped_by: ["dimension"],
          ids: ["bytes", "duration", "latency", "percent", "percentage", "traffic"],
          units: ["KiB", "seconds", "milliseconds", "percent", "percentage", "kilobits/s"],
          sts: {
            min: [0, 0, 0, 0, 0, 0],
            max: [1, 1, 1, 1, 1, 1],
          },
        },
      },
      db: {
        units: ["KiB", "seconds", "milliseconds", "percent", "percentage", "kilobits/s"],
        dimensions: {
          ids: ["bytes", "duration", "latency", "percent", "percentage", "traffic"],
          units: ["KiB", "seconds", "milliseconds", "percent", "percentage", "kilobits/s"],
          sts: {
            min: [0, 0, 0, 0, 0, 0],
            max: [1, 1, 1, 1, 1, 1],
          },
        },
      },
      result: {
        data: [],
        labels: ["time", "bytes", "duration", "latency", "percent", "percentage", "traffic"],
        point: { value: 0 },
      },
    }

    const result = camelizePayload(payload)

    expect(result.units).toEqual(["KiBy", "s", "ms", "%", "%", "Kibit/s"])
    expect(result.viewDimensions.units).toEqual(["KiBy", "s", "ms", "%", "%", "Kibit/s"])
    expect(result.dbUnits).toEqual(["KiBy", "s", "ms", "%", "%", "Kibit/s"])
    expect(result.dbDimensions.units).toEqual(["KiBy", "s", "ms", "%", "%", "Kibit/s"])
  })

  it("derives stepPlot for state units", () => {
    const payload = {
      view: {
        title: "Connection State",
        chart_type: "line",
        units: "state",
      },
      result: {
        data: [],
        labels: [],
        point: { value: 0 },
      },
    }

    const result = camelizePayload(payload)

    expect(result.stepPlot).toBe(true)
    expect(result.chartType).toBe("line")
  })

  it("handles summary data", () => {
    const payload = {
      summary: {
        nodes: [{ nd: "node1", ni: 0, nm: "Node 1" }],
        instances: [{ id: "inst1", ni: 0, nm: "Instance 1" }],
        dimensions: [{ id: "dim1" }],
      },
      result: {
        data: [],
        labels: [],
        point: { value: 0 },
      },
    }

    const result = camelizePayload(payload)

    expect(result.nodes).toHaveProperty("node1")
    expect(result.dimensions).toHaveProperty("dim1")
    expect(result.dimensionIds).toContain("dim1")
  })
})
