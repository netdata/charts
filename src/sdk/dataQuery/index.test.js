/** @jest-environment node */

import http from "http"
import makeSDK from "../index"
import { buildDataRequest } from "./request"
import { dataQueryNodeStatus } from "./response"
import { fetchDataRequest } from "./transport"

const responsePayload = {
  db: {
    per_tier: [
      {
        tier: 0,
        queries: 1,
        points: 1001,
        update_every: 1,
        first_entry: 900,
        last_entry: 2000,
      },
    ],
  },
  summary: {
    nodes: [{ mg: "machine-1", nd: "node-1", st: { code: 200 }, ds: { qr: 1 } }],
  },
  view: { dimensions: { aggregated: [1], units: ["percentage"] } },
  result: {
    labels: ["time", "machine-1"],
    data: [[1000, 0]],
    point: { value: 0 },
  },
}

const startServer = (handler, options) =>
  new Promise((resolve, reject) => {
    const server = options ? http.createServer(options, handler) : http.createServer(handler)
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address()
      resolve({ server, host: `http://127.0.0.1:${port}` })
    })
  })

const closeServer = server =>
  new Promise((resolve, reject) =>
    server.close(error => {
      if (error) reject(error)
      else resolve()
    })
  )

const readBody = request =>
  new Promise(resolve => {
    let body = ""
    request.setEncoding("utf8")
    request.on("data", chunk => (body += chunk))
    request.on("end", () => resolve(body))
  })

const queryAttributes = {
  selectedContexts: ["system.cpu"],
  contextScope: ["system.cpu"],
  selectedNodes: ["node-1"],
  selectedInstances: [],
  selectedDimensions: ["user"],
  dimensionsScope: ["user", "system"],
  selectedLabels: [],
  nodesScope: [],
  aggregationMethod: "sum",
  groupBy: ["node"],
  groupByLabel: [],
  groupingMethod: "average",
  groupingTime: 0,
  after: 1000,
  before: 2000,
  points: 1,
  limit: 1,
  tier: 0,
  timeGroupOptions: "95",
  unaligned: true,
}

const makeGeneratedNodeIds = count =>
  Array.from(
    { length: count },
    (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`
  )

describe("SDK data query transport", () => {
  it.each([
    ["negative limit", { limit: -1 }, "limit must be a positive integer"],
    ["zero limit", { limit: 0 }, "limit must be a positive integer"],
    ["mismatched limit", { limit: 2 }, "limit must match captured node count"],
    ["multiple points", { points: 2 }, "requires exactly one point"],
    ["non-node grouping", { groupBy: ["dimension"] }, "requires final grouping by node"],
    ["node label grouping", { groupByLabel: ["environment"] }, "node label grouping"],
    ["post aggregation", { showPostAggregations: true }, "does not support post aggregations"],
    ["relative window", { after: -300, before: 0 }, "requires an ordered absolute time window"],
    ["reversed window", { after: 2000, before: 1000 }, "requires an ordered absolute time window"],
    ["aligned request", { unaligned: false }, "requires unaligned results"],
    ["nonzero option", { options: ["jsonwrap", "nonzero"] }, "cannot eliminate zero values"],
    ["null2zero option", { options: ["jsonwrap", "null2zero"] }, "cannot convert gaps to zero"],
    ["non-JSON2 format", { format: "csv" }, "requires JSON2 format"],
    ["invalid time group options", { timeGroupOptions: { percentile: 95 } }, "must be a string"],
  ])("rejects invalid fleet request: %s", async (_name, overrides, message) => {
    const sdk = makeSDK({
      ui: {},
      attributes: { agent: false, host: "http://127.0.0.1:1" },
    })

    await expect(
      sdk.queryData({ ...queryAttributes, ...overrides }, { expectedNodeIds: ["node-1"] })
    ).rejects.toThrow(message)
  })

  it("requires an explicit tier when coverage proof is requested", async () => {
    const sdk = makeSDK({
      ui: {},
      attributes: { agent: false, host: "http://127.0.0.1:1" },
    })

    await expect(
      sdk.queryData(
        { ...queryAttributes, tier: undefined },
        { expectedNodeIds: ["node-1"], requireTierCoverage: true }
      )
    ).rejects.toThrow("tier coverage requires an explicit tier")
  })

  it("queries Cloud through the SDK with real transport and inherited bearer", async () => {
    let captured
    const { server, host } = await startServer(async (request, response) => {
      captured = {
        method: request.method,
        authorization: request.headers.authorization,
        body: JSON.parse(await readBody(request)),
      }
      response.writeHead(200, { "Content-Type": "application/json" })
      response.end(JSON.stringify(responsePayload))
    })

    try {
      const sdk = makeSDK({ ui: {}, attributes: { agent: false, host, bearer: "token" } })
      const result = await sdk.queryData(
        { ...queryAttributes, selectedNodes: [] },
        { expectedNodeIds: ["node-1"], requireTierCoverage: true }
      )

      expect(result.complete).toBe(true)
      expect(result.tierCoverage).toMatchObject({ exact: true, status: "exact" })
      expect(captured.method).toBe("POST")
      expect(captured.authorization).toBe("Bearer token")
      expect(captured.body.limit).toBe(1)
      expect(captured.body.selectors.nodes).toEqual(["*"])
      expect(captured.body.scope.dimensions).toEqual(["user", "system"])
      expect(captured.body.window.tier).toBe(0)
      expect(captured.body.options).toContain("unaligned")
    } finally {
      await closeServer(server)
    }
  })

  it("queries an Agent with real transport and X-Netdata auth", async () => {
    let captured
    const { server, host } = await startServer((request, response) => {
      captured = {
        method: request.method,
        auth: request.headers["x-netdata-auth"],
        url: new URL(request.url, host),
      }
      response.writeHead(200, { "Content-Type": "application/json" })
      response.end(JSON.stringify(responsePayload))
    })

    try {
      const sdk = makeSDK({
        ui: {},
        attributes: { agent: true, host, xNetdataBearer: "agent-token" },
      })
      const result = await sdk.queryData(queryAttributes, { expectedNodeIds: ["node-1"] })

      expect(result.complete).toBe(true)
      expect(result.tierCoverage).toBeUndefined()
      expect(captured.method).toBe("GET")
      expect(captured.auth).toBe("Bearer agent-token")
      expect(captured.url.searchParams.get("limit")).toBe("1")
      expect(captured.url.searchParams.get("tier")).toBe("0")
      expect(captured.url.searchParams.get("scope_dimensions")).toBe("user|system")
      expect(captured.url.searchParams.get("options")).toContain("unaligned")
    } finally {
      await closeServer(server)
    }
  })

  it("keeps a 6,107-member direct-Agent full-room request compact", async () => {
    let captured
    const emptyPayload = {
      summary: { nodes: [] },
      view: { dimensions: { ids: [], units: [] } },
      result: { labels: [], data: [], point: { value: 0 } },
    }
    const { server, host } = await startServer((request, response) => {
      captured = {
        method: request.method,
        url: new URL(request.url, host),
      }
      response.writeHead(200, { "Content-Type": "application/json" })
      response.end(JSON.stringify(emptyPayload))
    })
    const nodeIds = makeGeneratedNodeIds(6_107)
    const attributes = {
      ...queryAttributes,
      selectedNodes: [],
      nodesScope: [],
      limit: nodeIds.length,
      options: [],
    }

    try {
      const sdk = makeSDK({ ui: {}, attributes: { agent: true, host } })
      const expectedRequest = buildDataRequest({ ...attributes, agent: true, host })
      const oneMemberRequest = buildDataRequest({
        ...attributes,
        agent: true,
        host,
        limit: 1,
      })
      const expectedUrl = new URL(expectedRequest.url)
      const oneMemberUrl = new URL(oneMemberRequest.url)
      expectedUrl.searchParams.delete("limit")
      oneMemberUrl.searchParams.delete("limit")
      expect(expectedUrl.href).toBe(oneMemberUrl.href)
      expect(new TextEncoder().encode(expectedRequest.url).byteLength).toBeLessThan(2 * 1024)

      const result = await sdk.queryData(attributes, { expectedNodeIds: nodeIds })

      expect(captured.method).toBe("GET")
      expect(captured.url.href).toBe(expectedRequest.url)
      expect(captured.url.searchParams.get("nodes")).toBe("*")
      expect(captured.url.searchParams.get("scope_nodes")).toBe("*")
      expect(captured.url.searchParams.get("limit")).toBe(String(nodeIds.length))
      expect(captured.url.href).not.toMatch(/00000000-0000-4000-8000-/)
      expect(result.complete).toBe(true)
      expect(result.issues).toEqual([])
      expect(result.missingNodeIds).toHaveLength(nodeIds.length)
      expect(result.nodeStatuses.every(status => status === dataQueryNodeStatus.gap)).toBe(true)
      expect(result.resultIndexes.every(index => index === -1)).toBe(true)
    } finally {
      await closeServer(server)
    }
  })

  it("rejects an oversized direct-Agent URL before transport", async () => {
    let requestCount = 0
    const { server, host } = await startServer(
      (_request, response) => {
        requestCount += 1
        response.writeHead(200, { "Content-Type": "application/json" })
        response.end(JSON.stringify(responsePayload))
      },
      { maxHeaderSize: 256 * 1024 }
    )
    const nodeIds = makeGeneratedNodeIds(3_000)
    const attributes = {
      ...queryAttributes,
      selectedNodes: [],
      nodesScope: nodeIds,
      limit: nodeIds.length,
    }

    try {
      const sdk = makeSDK({ ui: {}, attributes: { agent: true, host } })
      const request = buildDataRequest({ ...attributes, agent: true, host })
      expect(new TextEncoder().encode(request.url).byteLength).toBeGreaterThan(96 * 1024)
      const error = await sdk
        .queryData(attributes, { expectedNodeIds: nodeIds })
        .catch(cause => cause)

      expect(error).toMatchObject({
        code: "request-too-large",
        name: "DataRequestError",
      })
      expect(error.message).toBe("Data request is too large for direct Agent transport")
      expect(error.message).not.toContain(nodeIds[0])
      expect(requestCount).toBe(0)
    } finally {
      await closeServer(server)
    }
  })

  it("allows a direct-Agent URL at the safety ceiling", async () => {
    let capturedUrl
    const { server, host } = await startServer(
      (request, response) => {
        capturedUrl = new URL(request.url, host).href
        response.writeHead(200, { "Content-Type": "application/json" })
        response.end(JSON.stringify(responsePayload))
      },
      { maxHeaderSize: 128 * 1024 }
    )
    const urlLimitBytes = 96 * 1024
    const baseAttributes = {
      ...queryAttributes,
      selectedNodes: [],
      nodesScope: ["a"],
      options: [],
    }
    const baseRequest = buildDataRequest({ ...baseAttributes, agent: true, host })
    const paddingLength = urlLimitBytes - new TextEncoder().encode(baseRequest.url).byteLength
    const attributes = {
      ...baseAttributes,
      nodesScope: [`a${"a".repeat(paddingLength)}`],
    }

    try {
      const sdk = makeSDK({ ui: {}, attributes: { agent: true, host } })
      await expect(sdk.queryData(attributes, { expectedNodeIds: ["node-1"] })).resolves.toEqual(
        expect.objectContaining({ payload: responsePayload })
      )

      const urlBytes = new TextEncoder().encode(capturedUrl).byteLength
      expect(urlBytes).toBe(urlLimitBytes)
    } finally {
      await closeServer(server)
    }
  })

  it("does not apply the direct-Agent URL ceiling to Cloud POST bodies", async () => {
    let captured
    const { server, host } = await startServer(async (request, response) => {
      captured = {
        method: request.method,
        body: JSON.parse(await readBody(request)),
      }
      response.writeHead(200, { "Content-Type": "application/json" })
      response.end(JSON.stringify(responsePayload))
    })
    const nodeIds = makeGeneratedNodeIds(3_000)

    try {
      const sdk = makeSDK({ ui: {}, attributes: { agent: false, host } })
      const result = await sdk.queryData(
        {
          ...queryAttributes,
          selectedNodes: [],
          nodesScope: nodeIds,
          limit: nodeIds.length,
        },
        { expectedNodeIds: nodeIds }
      )

      expect(result.payload).toEqual(responsePayload)
      expect(captured.method).toBe("POST")
      expect(captured.body.scope.nodes).toHaveLength(nodeIds.length)
      expect(captured.body.selectors.nodes).toEqual(["*"])
    } finally {
      await closeServer(server)
    }
  })

  it("propagates cancellation without converting it to a metric gap", async () => {
    const { server, host } = await startServer((_request, response) => {
      setTimeout(() => {
        response.writeHead(200, { "Content-Type": "application/json" })
        response.end(JSON.stringify(responsePayload))
      }, 50)
    })

    try {
      const sdk = makeSDK({ ui: {}, attributes: { agent: false, host } })
      const controller = new AbortController()
      const request = sdk.queryData(
        { ...queryAttributes, timeout: 1_000 },
        {
          expectedNodeIds: ["node-1"],
          signal: controller.signal,
        }
      )
      controller.abort()

      await expect(request).rejects.toMatchObject({ name: "AbortError" })
    } finally {
      await closeServer(server)
    }
  })

  it("preserves an earlier lifecycle abort when the deadline fires before fetch rejects", async () => {
    let requestStarted
    const started = new Promise(resolve => (requestStarted = resolve))
    const { server, host } = await startServer(() => requestStarted())
    const controller = new AbortController()

    jest.useFakeTimers({
      doNotFake: [
        "Date",
        "hrtime",
        "nextTick",
        "performance",
        "queueMicrotask",
        "setImmediate",
        "clearImmediate",
        "setInterval",
        "clearInterval",
      ],
    })

    try {
      const request = fetchDataRequest(
        { url: host, options: {} },
        { signal: controller.signal },
        { timeoutMs: 25 }
      )
      await started
      controller.signal.addEventListener("abort", () => jest.advanceTimersByTime(25), {
        once: true,
      })

      controller.abort()

      await expect(request).rejects.toMatchObject({ name: "AbortError" })
    } finally {
      jest.useRealTimers()
      await closeServer(server)
    }
  })

  it("preserves an earlier deadline when lifecycle aborts before fetch rejects", async () => {
    let requestStarted
    const started = new Promise(resolve => (requestStarted = resolve))
    const { server, host } = await startServer(() => requestStarted())
    const controller = new AbortController()

    jest.useFakeTimers({
      doNotFake: [
        "Date",
        "hrtime",
        "nextTick",
        "performance",
        "queueMicrotask",
        "setImmediate",
        "clearImmediate",
        "setInterval",
        "clearInterval",
      ],
    })

    try {
      const request = fetchDataRequest(
        { url: host, options: {} },
        { signal: controller.signal },
        { timeoutMs: 25 }
      )
      await started

      jest.advanceTimersByTime(25)
      controller.abort()

      await expect(request).rejects.toMatchObject({
        code: "timeout",
        name: "DataRequestError",
      })
    } finally {
      jest.useRealTimers()
      await closeServer(server)
    }
  })

  it("enforces an independent client deadline with a typed query failure", async () => {
    const { server, host } = await startServer(() => undefined)

    try {
      await expect(
        fetchDataRequest({ url: host, options: {} }, {}, { timeoutMs: 25 })
      ).rejects.toMatchObject({
        code: "timeout",
        name: "DataRequestError",
      })
    } finally {
      await closeServer(server)
    }
  })

  it("derives the client deadline from an explicit backend timeout", async () => {
    let requestStarted
    const started = new Promise(resolve => (requestStarted = resolve))
    let serverResponse
    let serverSocket
    let serializedTimeout
    const explicitTimeoutMs = 100_000
    const expectedClientDeadlineMs = explicitTimeoutMs + 5_000
    const { server, host } = await startServer(async (request, response) => {
      serializedTimeout = JSON.parse(await readBody(request)).timeout
      serverResponse = response
      serverSocket = request.socket
      response.writeHead(200, { "Content-Type": "application/json" })
      response.write("{")
      requestStarted()
    })
    const controller = new AbortController()

    jest.useFakeTimers({
      doNotFake: [
        "Date",
        "hrtime",
        "nextTick",
        "performance",
        "queueMicrotask",
        "setImmediate",
        "clearImmediate",
        "setInterval",
        "clearInterval",
      ],
    })

    try {
      const sdk = makeSDK({ ui: {}, attributes: { agent: false, host } })
      let settled = false
      const request = sdk.queryData(
        { ...queryAttributes, timeout: explicitTimeoutMs },
        { expectedNodeIds: ["node-1"], signal: controller.signal }
      )
      request.then(
        () => {
          settled = true
        },
        () => {
          settled = true
        }
      )

      await started
      expect(serializedTimeout).toBe(explicitTimeoutMs)

      jest.advanceTimersByTime(expectedClientDeadlineMs - 1)
      await Promise.resolve()
      expect(settled).toBe(false)

      jest.advanceTimersByTime(1)
      await expect(request).rejects.toMatchObject({
        code: "timeout",
        message: `Data request timed out after ${expectedClientDeadlineMs} ms`,
        name: "DataRequestError",
      })
      expect(settled).toBe(true)
    } finally {
      controller.abort()
      jest.useRealTimers()
      serverResponse?.destroy()
      serverSocket?.destroy()
      await closeServer(server)
    }
  })

  it("preserves cancellation while reading the response body", async () => {
    let bodyStarted
    const started = new Promise(resolve => (bodyStarted = resolve))
    const serialized = JSON.stringify(responsePayload)
    const { server, host } = await startServer((_request, response) => {
      response.writeHead(200, { "Content-Type": "application/json" })
      response.write(serialized.slice(0, 1))
      bodyStarted()
      setTimeout(() => response.end(serialized.slice(1)), 100)
    })

    try {
      const sdk = makeSDK({ ui: {}, attributes: { agent: false, host } })
      const controller = new AbortController()
      const request = sdk.queryData(queryAttributes, {
        expectedNodeIds: ["node-1"],
        signal: controller.signal,
      })
      await started
      await new Promise(resolve => setTimeout(resolve, 10))
      controller.abort()

      await expect(request).rejects.toMatchObject({ name: "AbortError" })
    } finally {
      await closeServer(server)
    }
  })

  it.each([
    [404, "application/json", JSON.stringify({ message: "missing route" })],
    [200, "text/html", "not json"],
  ])("rejects route and JSON failures", async (status, contentType, body) => {
    const { server, host } = await startServer((_request, response) => {
      response.writeHead(status, { "Content-Type": contentType })
      response.end(body)
    })

    try {
      const sdk = makeSDK({ ui: {}, attributes: { agent: false, host } })
      await expect(
        sdk.queryData(queryAttributes, { expectedNodeIds: ["node-1"] })
      ).rejects.toMatchObject({ name: "DataRequestError" })
    } finally {
      await closeServer(server)
    }
  })

  it("preserves the rendered-chart contract for non-OK JSON payloads", async () => {
    const payload = { message: "temporary failure" }
    const { server, host } = await startServer((_request, response) => {
      response.writeHead(503, { "Content-Type": "application/json" })
      response.end(JSON.stringify(payload))
    })

    try {
      await expect(
        fetchDataRequest({ url: host, options: {} }, {}, { rejectHttpErrors: false })
      ).resolves.toEqual(payload)
      await expect(fetchDataRequest({ url: host, options: {} })).rejects.toMatchObject({
        name: "DataRequestError",
        status: 503,
      })
    } finally {
      await closeServer(server)
    }
  })

  it("preserves HTTP status for strict JSON error payloads", async () => {
    const payload = { errorMessage: "temporary failure" }
    const { server, host } = await startServer((_request, response) => {
      response.writeHead(503, { "Content-Type": "application/json" })
      response.end(JSON.stringify(payload))
    })

    try {
      await expect(fetchDataRequest({ url: host, options: {} })).rejects.toMatchObject({
        name: "DataRequestError",
        status: 503,
        payload,
      })
    } finally {
      await closeServer(server)
    }
  })

  it("preserves native JSON errors for rendered charts", async () => {
    const { server, host } = await startServer((_request, response) => {
      response.writeHead(200, { "Content-Type": "text/html" })
      response.end("not json")
    })

    try {
      await expect(
        fetchDataRequest(
          { url: host, options: {} },
          {},
          { rejectHttpErrors: false, wrapJsonErrors: false }
        )
      ).rejects.toMatchObject({ name: "SyntaxError" })
    } finally {
      await closeServer(server)
    }
  })
})
