import makeLog from "./makeLog"

describe("makeLog", () => {
  let mockChart
  let mockSendLog
  let log

  beforeEach(() => {
    mockSendLog = jest.fn()
    mockChart = {
      getAttribute: jest.fn((key) => {
        if (key === "id") return "test-chart"
        if (key === "logOptions") return { sendLog: mockSendLog, payload: { data: { base: "value" } } }
        return null
      })
    }
    log = makeLog(mockChart)
  })

  it("creates log function", () => {
    expect(typeof log).toBe("function")
  })

  it("calls sendLog with merged data", () => {
    const payload = { action: "test", data: { custom: "data" } }
    
    log(payload)

    expect(mockSendLog).toBeCalledWith({
      action: "test",
      data: { base: "value" },
      custom: "data",
      base: "value",
      chartId: "test-chart"
    })
  })

  it("handles empty payload", () => {
    log()

    expect(mockSendLog).toBeCalledWith({
      data: { base: "value" },
      base: "value",
      chartId: "test-chart"
    })
  })

  it("returns noop when chart is null", () => {
    const nullLog = makeLog(null)
    
    expect(typeof nullLog()).toBe("function")
  })

  it("handles missing logOptions", () => {
    mockChart.getAttribute.mockReturnValue(null)
    const simpleLog = makeLog(mockChart)
    
    expect(() => simpleLog()).not.toThrow()
  })

  it("handles missing sendLog function", () => {
    mockChart.getAttribute.mockImplementation((key) => {
      if (key === "logOptions") return { payload: {} }
      return "test-chart"
    })
    
    const logWithoutSender = makeLog(mockChart)
    
    expect(() => logWithoutSender()).not.toThrow()
  })

  it("merges payload data correctly", () => {
    const payload = { 
      event: "click", 
      data: { overlay: "annotation" } 
    }
    
    log(payload)

    expect(mockSendLog).toBeCalledWith({
      event: "click",
      data: { base: "value" },
      overlay: "annotation",
      base: "value",
      chartId: "test-chart"
    })
  })
})