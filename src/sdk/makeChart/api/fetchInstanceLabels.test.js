import { makeTestChart } from "@jest/testUtilities"
import fetchInstanceLabels, { parseInstanceLabels } from "./fetchInstanceLabels"

const detailedResponse = {
  detailed: {
    nodes: {
      "mg-1": {
        nd: "nd-1",
        ni: 0,
        nm: "host-1",
        contexts: {
          "sensors.temperature": {
            instances: {
              "sensors.temperature_nvme_temp1": {
                nm: "temp1",
                labels: { chip_id: "nvme-pci-0020", feature: "temp1" },
                dimensions: {},
              },
            },
          },
        },
      },
      "mg-2": {
        ni: 1,
        nm: "host-2",
        contexts: {
          "sensors.temperature": {
            instances: { "sensors.temperature_cpu": { nm: "cpu", dimensions: {} } },
          },
        },
      },
    },
  },
}

const withFakeFetch = async (response, run) => {
  const originalFetch = global.fetch
  const requests = []
  global.fetch = (url, options) => {
    requests.push({ url, options })
    return Promise.resolve({ ok: true, json: () => Promise.resolve(response) })
  }
  try {
    return await run(requests)
  } finally {
    global.fetch = originalFetch
  }
}

const selections = {
  selectedInstances: ["sensors.temperature_cpu@nd-1"],
  selectedDimensions: ["input"],
  selectedLabels: ["chip_id:nvme-pci-0020"],
  selectedContexts: ["sensors.temperature"],
  nodesScope: ["nd-1", "mg-2"],
  contextScope: ["sensors.temperature"],
  groupBy: ["dimension"],
  showPostAggregations: true,
  postGroupBy: ["node"],
  after: 1000,
  before: 2000,
}

describe("parseInstanceLabels", () => {
  it("keys instances like the chart does, preferring the node id over the machine guid", () => {
    expect(parseInstanceLabels(detailedResponse)).toEqual({
      "sensors.temperature_nvme_temp1@nd-1": {
        context: "sensors.temperature",
        node: "nd-1",
        labels: { chip_id: "nvme-pci-0020", feature: "temp1" },
      },
      "sensors.temperature_cpu@mg-2": {
        context: "sensors.temperature",
        node: "mg-2",
        labels: {},
      },
    })
  })

  it("returns no labels for a response without details", () => {
    expect(parseInstanceLabels({ result: {} })).toEqual({})
  })
})

describe("fetchInstanceLabels", () => {
  it("asks an agent for details across every instance, dimension and label", async () => {
    const { chart } = makeTestChart({
      attributes: { ...selections, agent: true, host: "http://localhost:19999/api/v3" },
    })

    const labels = await withFakeFetch(detailedResponse, async requests => {
      const result = await fetchInstanceLabels(chart)
      const params = new URLSearchParams(requests[0].url.split("?")[1])

      expect(requests[0].url.startsWith("http://localhost:19999/api/v3/data?")).toBe(true)
      expect(params.get("options").split("|")).toEqual(["jsonwrap", "minify", "details"])
      expect(params.get("instances")).toBe("*")
      expect(params.get("dimensions")).toBe("*")
      expect(params.get("labels")).toBe("*")
      expect(params.get("contexts")).toBe("sensors.temperature")
      expect(params.get("scope_nodes")).toBe("nd-1|mg-2")
      expect(params.get("scope_contexts")).toBe("sensors.temperature")
      expect(params.get("group_by[0]")).toBe("instance")
      expect(params.get("group_by[1]")).toBeNull()
      expect(params.get("points")).toBe("1")
      expect(params.get("after")).toBe("1000")
      expect(params.get("before")).toBe("2000")
      return result
    })

    expect(Object.keys(labels)).toEqual([
      "sensors.temperature_nvme_temp1@nd-1",
      "sensors.temperature_cpu@mg-2",
    ])
  })

  it("asks the cloud for details with the chart's auth and abort signal", async () => {
    const { chart } = makeTestChart({
      attributes: {
        ...selections,
        agent: false,
        host: "https://app.netdata.cloud/api/v3/spaces/s/rooms/r",
        bearer: "token",
      },
    })
    const controller = new AbortController()

    await withFakeFetch(detailedResponse, async requests => {
      await fetchInstanceLabels(chart, { signal: controller.signal })
      const { url, options } = requests[0]
      const payload = JSON.parse(options.body)

      expect(url).toBe("https://app.netdata.cloud/api/v3/spaces/s/rooms/r/data")
      expect(options.signal).toBe(controller.signal)
      expect(options.headers).toEqual({ Authorization: "Bearer token" })
      expect(payload.options).toEqual(["jsonwrap", "minify", "details"])
      expect(payload.selectors).toEqual({
        contexts: ["sensors.temperature"],
        nodes: ["*"],
        instances: ["*"],
        dimensions: ["*"],
        labels: ["*"],
      })
      expect(payload.scope).toEqual({ contexts: ["sensors.temperature"], nodes: ["nd-1", "mg-2"] })
      expect(payload.aggregations.metrics).toEqual([
        expect.objectContaining({ group_by: ["instance"] }),
      ])
      expect(payload.window).toEqual(expect.objectContaining({ after: 1000, points: 1 }))
    })
  })

  it("rejects when the request fails", async () => {
    const { chart } = makeTestChart({ attributes: { agent: true } })
    const originalFetch = global.fetch
    global.fetch = () =>
      Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })

    try {
      await expect(fetchInstanceLabels(chart)).rejects.toThrow("HTTP 500")
    } finally {
      global.fetch = originalFetch
    }
  })
})
