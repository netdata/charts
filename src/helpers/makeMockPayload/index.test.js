import makeMockPayload from "./index"

describe("makeMockPayload", () => {
  let mockChart
  let mockPayload

  beforeEach(() => {
    mockChart = {
      getAttributes: jest.fn(() => ({
        after: -300,
        before: 0,
      })),
    }

    mockPayload = {
      result: {
        data: [
          [1000, 10, 20],
          [2000, 15, 25],
          [3000, 20, 30],
        ],
        labels: ["time", "cpu", "memory"],
      },
    }

    jest.spyOn(Date, "now").mockReturnValue(10000)
  })

  afterEach(() => {
    Date.now.mockRestore()
  })

  it("creates mock payload function", () => {
    const mockFn = makeMockPayload(mockPayload)
    expect(typeof mockFn).toBe("function")
  })

  it("handles array result payload", async () => {
    const arrayPayload = {
      result: [
        [1000, 10],
        [2000, 20],
      ],
    }
    const mockFn = makeMockPayload(arrayPayload)

    mockChart.getAttributes.mockReturnValue({ after: -100, before: 0 })

    const result = await mockFn(mockChart)

    expect(result).toHaveProperty("after")
    expect(result).toHaveProperty("before")
    expect(result.result).toEqual(arrayPayload.result)
  })

  it("handles positive after value for array result", async () => {
    const arrayPayload = {
      result: [
        [1000, 10],
        [2000, 20],
      ],
    }
    const mockFn = makeMockPayload(arrayPayload)

    mockChart.getAttributes.mockReturnValue({ after: 5000, before: 6000 })

    const result = await mockFn(mockChart)

    expect(result.after).toBe(5000)
    expect(result.before).toBe(6000)
  })

  it("transforms data timestamps for object result", async () => {
    const mockFn = makeMockPayload(mockPayload)

    const result = await mockFn(mockChart)

    expect(result.result.data).toHaveLength(3)
    expect(result.result.data[0]).toHaveLength(3)
    expect(typeof result.result.data[0][0]).toBe("number")
  })

  it("preserves non-data properties", async () => {
    const mockFn = makeMockPayload(mockPayload)

    const result = await mockFn(mockChart)

    expect(result.result.labels).toEqual(mockPayload.result.labels)
  })

  it("handles post aggregated data", async () => {
    const payloadWithPostAgg = {
      ...mockPayload,
      result: {
        ...mockPayload.result,
        post_aggregated_data: {
          series1: [1, 2, 3],
          series2: [4, 5, 6],
        },
      },
    }

    const mockFn = makeMockPayload(payloadWithPostAgg)

    const result = await mockFn(mockChart)

    expect(result.result).toHaveProperty("post_aggregated_data")
    expect(result.result.post_aggregated_data).toHaveProperty("series1")
    expect(result.result.post_aggregated_data).toHaveProperty("series2")
  })

  it("respects delay option", async () => {
    const mockFn = makeMockPayload(mockPayload, { delay: 10 })

    const startTime = performance.now()
    await mockFn(mockChart)
    const endTime = performance.now()

    expect(endTime - startTime).toBeGreaterThanOrEqual(5)
  })

  it("handles missing post aggregated data", async () => {
    const payloadWithoutPostAgg = {
      ...mockPayload,
      result: {
        ...mockPayload.result,
      },
    }

    const mockFn = makeMockPayload(payloadWithoutPostAgg)

    const result = await mockFn(mockChart)

    expect(result.result.post_aggregated_data).toBeUndefined()
  })
})
