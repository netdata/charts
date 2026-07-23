import {
  buildAgentDataPayload,
  buildCloudDataPayload,
  buildDataRequest,
  withDataRequestAuth,
} from "./request"

const attributes = {
  host: "https://example.test",
  selectedContexts: ["system.cpu"],
  context: "ignored.context",
  nodesScope: [],
  contextScope: ["system.cpu"],
  selectedNodes: ["node-1", "node-2"],
  selectedInstances: [],
  selectedDimensions: ["user"],
  selectedLabels: [],
  aggregationMethod: "sum",
  groupBy: ["node"],
  groupByLabel: [],
  postGroupBy: ["selected"],
  postGroupByLabel: [],
  postAggregationMethod: "avg",
  showPostAggregations: false,
  after: 1000,
  before: 2000,
  points: 1,
  format: "json2",
  groupingMethod: "average",
  groupingTime: 0,
  options: ["jsonwrap", "flip", "ms", "jw-anomaly-rates", "minify"],
}

describe("data query requests", () => {
  it("preserves the legacy Cloud payload when optional data-query attributes are absent", () => {
    expect(buildCloudDataPayload(attributes)).toEqual({
      format: "json2",
      options: ["jsonwrap", "flip", "ms", "jw-anomaly-rates", "minify"],
      scope: { contexts: ["system.cpu"], nodes: [] },
      selectors: {
        contexts: ["system.cpu"],
        nodes: ["node-1", "node-2"],
        instances: ["*"],
        dimensions: ["user"],
        labels: ["*"],
      },
      aggregations: {
        metrics: [
          {
            group_by: ["node"],
            group_by_label: [],
            aggregation: "sum",
          },
        ],
        time: {
          time_group: "average",
          time_resampling: 0,
        },
      },
      window: { after: 1000, before: 2000, points: 1 },
    })
  })

  it("preserves the legacy Agent payload when optional data-query attributes are absent", () => {
    expect(buildAgentDataPayload(attributes)).toEqual({
      points: 1,
      format: "json2",
      time_group: "average",
      time_resampling: 0,
      after: 1000,
      before: 2000,
      options: "jsonwrap|flip|ms|jw-anomaly-rates|minify",
      contexts: "system.cpu",
      scope_contexts: "system.cpu",
      scope_nodes: "*",
      nodes: "node-1|node-2",
      instances: "*",
      dimensions: "user",
      labels: "*",
      "group_by[0]": "node",
      "group_by_label[0]": "",
      "aggregation[0]": "sum",
    })
  })

  it("preserves legacy post-aggregation payloads", () => {
    const postAggregations = { ...attributes, showPostAggregations: true }

    expect(buildCloudDataPayload(postAggregations).aggregations.metrics[1]).toEqual({
      group_by: ["selected"],
      group_by_label: [],
      aggregation: "avg",
    })
    expect(buildAgentDataPayload(postAggregations)).toEqual(
      expect.objectContaining({
        "group_by[1]": "selected",
        "group_by_label[1]": "",
        "aggregation[1]": "avg",
      })
    )
  })

  it("adds explicit data-query attributes to both transports without duplicating unaligned", () => {
    const explicitDataQueryAttributes = {
      ...attributes,
      dimensionsScope: ["user", "system"],
      timeGroupOptions: "95",
      tier: 0,
      limit: 50_000,
      timeout: 180_000,
      unaligned: true,
      options: [...attributes.options, "unaligned"],
    }

    const cloud = buildCloudDataPayload(explicitDataQueryAttributes)
    expect(cloud.aggregations.time.time_group_options).toBe("95")
    expect(cloud.scope.dimensions).toEqual(["user", "system"])
    expect(cloud.window.tier).toBe(0)
    expect(cloud.limit).toBe(50_000)
    expect(cloud.timeout).toBe(180_000)
    expect(cloud.options.filter(option => option === "unaligned")).toHaveLength(1)

    const agent = buildAgentDataPayload(explicitDataQueryAttributes)
    expect(agent.time_group_options).toBe("95")
    expect(agent.scope_dimensions).toBe("user|system")
    expect(agent.tier).toBe(0)
    expect(agent.limit).toBe(50_000)
    expect(agent.timeout).toBe(180_000)
    expect(agent.options.split("|").filter(option => option === "unaligned")).toHaveLength(1)
  })

  it("builds POST and GET requests from the same attributes", () => {
    const cloud = buildDataRequest({ ...attributes, agent: false })
    expect(cloud.url).toBe("https://example.test/data")
    expect(cloud.options.method).toBe("POST")
    expect(JSON.parse(cloud.options.body)).toEqual(buildCloudDataPayload(attributes))

    const agent = buildDataRequest({ ...attributes, agent: true })
    expect(agent.url).toContain("https://example.test/data?")
    const query = new URL(agent.url).searchParams
    expect(query.get("nodes")).toBe("node-1|node-2")
    expect(query.get("group_by[0]")).toBe("node")
  })

  it("uses the same bearer precedence as rendered charts", () => {
    expect(
      withDataRequestAuth(
        { bearer: "cloud-token", xNetdataBearer: "agent-token" },
        { signal: "signal" }
      )
    ).toEqual({
      signal: "signal",
      headers: { Authorization: "Bearer cloud-token" },
    })

    expect(withDataRequestAuth({ xNetdataBearer: "agent-token" })).toEqual({
      headers: { "X-Netdata-Auth": "Bearer agent-token" },
    })

    const options = { signal: "signal" }
    expect(withDataRequestAuth({}, options)).toBe(options)
  })
})
