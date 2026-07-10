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

  it("keeps raw JSON2 cells instead of allocating per-point objects", () => {
    const data = [
      [1000, [10, 2, 4], [20, 3, 8]],
      [2000, [30, 5, 16], [40, 7, 32]],
    ]
    const point = { value: 0, arp: 1, pa: 2 }
    const payload = {
      result: {
        data,
        labels: ["time", "cpu", "memory"],
        point,
      },
    }

    const result = camelizePayload(payload).result

    expect(result.all).toBe(data)
    expect(result.all[0][1]).toBe(data[0][1])
    expect(result.point).toBe(point)
    expect(result.data).toEqual([
      [1000, 10, 20, null, null],
      [2000, 30, 40, null, null],
    ])
    expect(result.byDimension).toEqual({
      cpu: { min: 10, max: 30 },
      memory: { min: 20, max: 40 },
    })
  })

  it("preserves the compact shape for thousands of dimensions", () => {
    const dimensionCount = 5256
    const labels = ["time", ...Array.from({ length: dimensionCount }, (_, index) => `d${index}`)]
    const data = Array.from({ length: 3 }, (_, rowIndex) => [
      rowIndex * 1000,
      ...Array.from({ length: dimensionCount }, (_, dimensionIndex) => [
        dimensionIndex + rowIndex,
        0,
        0,
      ]),
    ])
    const payload = {
      result: { data, labels, point: { value: 0, arp: 1, pa: 2 } },
    }

    const result = camelizePayload(payload).result

    expect(result.all).toBe(data)
    expect(result.data).toHaveLength(3)
    expect(result.data[0]).toHaveLength(dimensionCount + 3)
    expect(result.all[2][dimensionCount][0]).toBe(dimensionCount + 1)
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
      "GB",
      "TB",
      "PB",
      "GBy",
      "TiB",
      "PiB",
      "MB/s",
      "GB/s",
      "Hz",
      "seconds",
      "second",
      "sec",
      "secs",
      "milliseconds",
      "millisecond",
      "ms",
      "microsecond",
      "us",
      "nanosecond",
      "nanoseconds",
      "minutes",
      "hours",
      "hr",
      "hrs",
      "days",
      "weeks",
      "months",
      "years",
      "percent",
      "percentage",
      "bits",
      "bits/s",
      "kilobits",
      "kbit/s",
      "megabits",
      "kilobits/s",
      "Mbps",
      "MHz",
      "KiB/operation",
      "kilobytes per operation",
      "milliseconds/request",
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
      "Celcius",
      "Joules",
      "pcent",
    ]
    const expectedUnits = [
      "KiBy",
      "KBy",
      "MiBy",
      "MBy",
      "GBy",
      "TBy",
      "PBy",
      "GBy",
      "TiBy",
      "PiBy",
      "MBy/s",
      "GBy/s",
      "Hz",
      "s",
      "s",
      "s",
      "s",
      "ms",
      "ms",
      "ms",
      "us",
      "us",
      "ns",
      "ns",
      "min",
      "h",
      "h",
      "h",
      "d",
      "wk",
      "mo",
      "a",
      "%",
      "%",
      "bit",
      "bit/s",
      "Kibit",
      "Kibit/s",
      "Mibit",
      "Kibit/s",
      "Mibit/s",
      "MHz",
      "KiBy/{operation}",
      "KBy/{operation}",
      "ms/{request}",
      "ms/{operation}",
      "ms/s",
      "ms/s",
      "us/s",
      "GBy",
      "GiBy/s",
      "m[CPU]",
      "mA",
      "mV",
      "mW",
      "dB[mW]",
      "Cel",
      "J",
      "%",
    ]
    const ids = sourceUnits.map((_, index) => `dimension-${index}`)
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
