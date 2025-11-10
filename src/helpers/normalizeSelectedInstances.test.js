import normalizeSelectedInstances from "./normalizeSelectedInstances"

describe("normalizeSelectedInstances", () => {
  const mockInstances = {
    "system.cpu@node1": {
      id: "system.cpu",
      nm: "cpu_usage@Node 1",
    },
    "system.cpu@node2": {
      id: "system.cpu",
      nm: "cpu_usage@Node 2",
    },
    "system.memory@node1": {
      id: "system.memory",
      nm: "memory_usage@Node 1",
    },
    "app.nginx@node3": {
      id: "app.nginx",
      nm: "nginx_requests@Node 3",
    },
  }

  it("should return empty array for empty selectedInstances", () => {
    const result = normalizeSelectedInstances([], mockInstances)
    expect(result).toEqual([])
  })

  it("should return selectedInstances if instances is not an object", () => {
    const selected = ["system.cpu@node1"]
    const result = normalizeSelectedInstances(selected, null)
    expect(result).toEqual(selected)
  })

  it("should keep exact key match", () => {
    const selected = ["system.cpu@node1"]
    const result = normalizeSelectedInstances(selected, mockInstances)
    expect(result).toEqual(["system.cpu@node1"])
  })

  it("should match instance id without @ to all instances with that id", () => {
    const selected = ["system.cpu"]
    const result = normalizeSelectedInstances(selected, mockInstances)
    expect(result.sort()).toEqual(["system.cpu@node1", "system.cpu@node2"])
  })

  it("should match with prefix wildcard *", () => {
    const selected = ["system.cpu*"]
    const result = normalizeSelectedInstances(selected, mockInstances)
    expect(result.sort()).toEqual(["system.cpu@node1", "system.cpu@node2"])
  })

  it("should match with suffix wildcard *", () => {
    const selected = ["*@node1"]
    const result = normalizeSelectedInstances(selected, mockInstances)
    expect(result.sort()).toEqual(["system.cpu@node1", "system.memory@node1"])
  })

  it("should match with both wildcards *", () => {
    const selected = ["*cpu*"]
    const result = normalizeSelectedInstances(selected, mockInstances)
    expect(result.sort()).toEqual(["system.cpu@node1", "system.cpu@node2"])
  })

  it("should match instance name", () => {
    const selected = ["cpu_usage"]
    const result = normalizeSelectedInstances(selected, mockInstances)
    expect(result.sort()).toEqual(["system.cpu@node1", "system.cpu@node2"])
  })

  it("should match instance name with wildcard", () => {
    const selected = ["*Node 1"]
    const result = normalizeSelectedInstances(selected, mockInstances)
    expect(result.sort()).toEqual(["system.cpu@node1", "system.memory@node1"])
  })

  it("should remove duplicates", () => {
    const selected = ["system.cpu", "system.cpu@node1", "system.cpu*"]
    const result = normalizeSelectedInstances(selected, mockInstances)
    expect(result.sort()).toEqual(["system.cpu@node1", "system.cpu@node2"])
  })

  it("should omit selections that dont match anything", () => {
    const selected = ["nonexistent", "system.cpu"]
    const result = normalizeSelectedInstances(selected, mockInstances)
    expect(result.sort()).toEqual(["system.cpu@node1", "system.cpu@node2"])
  })

  it("should handle multiple different selections", () => {
    const selected = ["system.memory", "app.nginx@node3"]
    const result = normalizeSelectedInstances(selected, mockInstances)
    expect(result.sort()).toEqual(["app.nginx@node3", "system.memory@node1"])
  })

  it("should skip invalid selections", () => {
    const selected = ["system.cpu", null, "", undefined, "app.nginx"]
    const result = normalizeSelectedInstances(selected, mockInstances)
    expect(result.sort()).toEqual(["app.nginx@node3", "system.cpu@node1", "system.cpu@node2"])
  })
})
