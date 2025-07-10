import makeLog from "./makeLog"
import { makeTestChart } from "@jest/testUtilities"

describe("makeLog", () => {
  let sendLogCalls
  let realSendLog

  beforeEach(() => {
    sendLogCalls = []
    realSendLog = data => {
      sendLogCalls.push(data)
    }
  })

  it("creates log function", () => {
    const { chart } = makeTestChart()
    const log = makeLog(chart)

    expect(typeof log).toBe("function")
  })

  it("calls sendLog with merged data", () => {
    const { chart } = makeTestChart({
      attributes: {
        logOptions: {
          sendLog: realSendLog,
          payload: { data: { base: "value" } },
        },
      },
    })

    const log = makeLog(chart)
    const payload = { action: "test", data: { custom: "data" } }

    log(payload)

    expect(sendLogCalls).toHaveLength(1)
    expect(sendLogCalls[0]).toEqual({
      action: "test",
      data: { base: "value" },
      custom: "data",
      base: "value",
      chartId: chart.getAttribute("id"),
    })
  })

  it("handles empty payload", () => {
    const { chart } = makeTestChart({
      attributes: {
        logOptions: {
          sendLog: realSendLog,
          payload: { data: { base: "value" } },
        },
      },
    })

    const log = makeLog(chart)
    log()

    expect(sendLogCalls).toHaveLength(1)
    expect(sendLogCalls[0]).toEqual({
      data: { base: "value" },
      base: "value",
      chartId: chart.getAttribute("id"),
    })
  })

  it("returns noop when chart is null", () => {
    const nullLog = makeLog(null)

    expect(typeof nullLog()).toBe("function")
  })

  it("handles missing sendLog function", () => {
    const { chart } = makeTestChart({
      attributes: {
        logOptions: { payload: {} },
      },
    })

    const logWithoutSender = makeLog(chart)

    expect(() => logWithoutSender()).not.toThrow()
  })

  it("merges payload data correctly", () => {
    const { chart } = makeTestChart({
      attributes: {
        logOptions: {
          sendLog: realSendLog,
          payload: { data: { base: "value" } },
        },
      },
    })

    const log = makeLog(chart)
    const payload = {
      event: "click",
      data: { overlay: "annotation" },
    }

    log(payload)

    expect(sendLogCalls).toHaveLength(1)
    expect(sendLogCalls[0]).toEqual({
      event: "click",
      data: { base: "value" },
      overlay: "annotation",
      base: "value",
      chartId: chart.getAttribute("id"),
    })
  })
})
