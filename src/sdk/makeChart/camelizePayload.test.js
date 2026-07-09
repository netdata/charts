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
    const sourceUnits = [
      "KiB",
      "KB",
      "MiB",
      "MB",
      "seconds",
      "milliseconds",
      "ms",
      "us",
      "percent",
      "percentage",
      "kilobits",
      "kilobits/s",
      "Mbps",
      "MHz",
      "KiB/operation",
      "milliseconds/request",
      "milliseconds/run",
      "milliseconds/operation",
      "milliseconds/s",
      "ms/s",
      "usec/s",
      "gigabytes",
      "GiB/s",
      "millicpu",
      "mA",
      "millivolts",
      "mJ/s",
      "dBm",
    ]
    const expectedUnits = [
      "KiBy",
      "KiBy",
      "MiBy",
      "MiBy",
      "s",
      "ms",
      "ms",
      "us",
      "%",
      "%",
      "Kibit",
      "Kibit/s",
      "Mibit/s",
      "MHz",
      "KiBy/{operation}",
      "ms/{request}",
      "ms/{run}",
      "ms/{operation}",
      "ms/s",
      "ms/s",
      "us/s",
      "GiBy",
      "GiBy/s",
      "m[CPU]",
      "mA",
      "mV",
      "mW",
      "dB[mW]",
    ]
    const ids = [
      "bytes",
      "shortBytes",
      "mebibytes",
      "megabytes",
      "duration",
      "latency",
      "shortLatency",
      "microLatency",
      "percent",
      "percentage",
      "trafficBits",
      "traffic",
      "megabitTraffic",
      "frequency",
      "bytesPerOperation",
      "requestLatency",
      "runLatency",
      "operationLatency",
      "latencyPerSecond",
      "shortLatencyPerSecond",
      "legacyLatencyPerSecond",
      "capacity",
      "capacityRate",
      "cpu",
      "current",
      "voltage",
      "powerRate",
      "wirelessSignal",
    ]
    const payload = {
      view: {
        chart_type: "line",
        units: sourceUnits,
        dimensions: {
          grouped_by: ["dimension"],
          ids,
          units: sourceUnits,
          sts: {
            min: ids.map(() => 0),
            max: ids.map(() => 1),
          },
        },
      },
      db: {
        units: sourceUnits,
        dimensions: {
          ids,
          units: sourceUnits,
          sts: {
            min: ids.map(() => 0),
            max: ids.map(() => 1),
          },
        },
      },
      result: {
        data: [],
        labels: ["time", ...ids],
        point: { value: 0 },
      },
    }

    const result = camelizePayload(payload)

    expect(result.units).toEqual(expectedUnits)
    expect(result.viewDimensions.units).toEqual(expectedUnits)
    expect(result.dbUnits).toEqual(expectedUnits)
    expect(result.dbDimensions.units).toEqual(expectedUnits)
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
