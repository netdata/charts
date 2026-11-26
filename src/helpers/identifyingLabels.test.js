import { getIdentifyingLabels, labelPriority } from "./identifyingLabels"

const sensor = (id, labels) => ({
  id,
  context: "sensors.temperature",
  node: "n1",
  labels: { subsystem: "hwmon", _collect_module: "sensors", _collect_job: id, ...labels },
})

describe("getIdentifyingLabels", () => {
  it("returns an empty object for empty input", () => {
    expect(getIdentifyingLabels([])).toEqual({})
  })

  it("picks the minimal identifying set, fills up to max and keeps system labels out", () => {
    const rows = [
      sensor("r1", { chip_id: "nvme-0020", feature: "temp1", label: "Composite", driver: "nvme" }),
      sensor("r2", { chip_id: "nvme-0020", feature: "temp2", label: "Sensor 1", driver: "nvme" }),
      sensor("r3", { chip_id: "nvme-0030", feature: "temp1", label: "Composite", driver: "nvme" }),
      sensor("r4", { chip_id: "core-0000", feature: "temp1", label: "Package", driver: "core" }),
    ]

    const result = getIdentifyingLabels(rows)

    expect(result.r1).toEqual({
      pairs: [
        ["chip_id", "nvme-0020"],
        ["driver", "nvme"],
        ["feature", "temp1"],
      ],
      rest: [
        ["label", "Composite"],
        ["subsystem", "hwmon"],
      ],
      ambiguous: false,
    })
    expect(result.r4.pairs).toEqual([
      ["chip_id", "core-0000"],
      ["driver", "core"],
      ["feature", "temp1"],
    ])
  })

  it("shows only the identifying set when it already fills max", () => {
    const rows = [
      sensor("r1", { chip_id: "a", feature: "temp1", label: "x" }),
      sensor("r2", { chip_id: "a", feature: "temp2", label: "x" }),
      sensor("r3", { chip_id: "b", feature: "temp1", label: "y" }),
    ]

    expect(getIdentifyingLabels(rows, { max: 2 }).r2).toEqual({
      pairs: [
        ["chip_id", "a"],
        ["feature", "temp2"],
      ],
      rest: [
        ["label", "x"],
        ["subsystem", "hwmon"],
      ],
      ambiguous: false,
    })
  })

  describe("priority", () => {
    const pod = (id, container, podName, controller) => ({
      id,
      context: "k8s.cgroup.cpu",
      node: "n1",
      labels: {
        k8s_container_name: container,
        k8s_pod_name: podName,
        k8s_controller_name: controller,
      },
    })
    const rows = [
      pod("a", "app", "p1", "c1"),
      pod("b", "app", "p2", "c2"),
      pod("c", "side", "p1", "c1"),
    ]

    it("prefers the pod name when several sets identify equally well", () => {
      expect(labelPriority).toEqual(["k8s_pod_name", "k8s_controller_name"])
      expect(getIdentifyingLabels(rows, { max: 2 }).a).toEqual({
        pairs: [
          ["k8s_pod_name", "p1"],
          ["k8s_container_name", "app"],
        ],
        rest: [["k8s_controller_name", "c1"]],
        ambiguous: false,
      })
    })

    it("follows a custom priority", () => {
      const result = getIdentifyingLabels(rows, {
        max: 2,
        priority: ["k8s_controller_name", "k8s_pod_name"],
      })

      expect(result.a.pairs).toEqual([
        ["k8s_controller_name", "c1"],
        ["k8s_container_name", "app"],
      ])
      expect(result.a.rest).toEqual([["k8s_pod_name", "p1"]])
    })
  })

  it("treats a missing label as a value of its own", () => {
    const row = (id, labels) => ({ id, context: "disk.io", node: "n1", labels })
    const rows = [
      row("a", { disk: "sda", part: "1" }),
      row("b", { disk: "sda" }),
      row("c", { disk: "sdb" }),
      row("d", { disk: "sdc" }),
    ]

    const result = getIdentifyingLabels(rows, { max: 2 })

    expect(result.a.pairs).toEqual([
      ["disk", "sda"],
      ["part", "1"],
    ])
    expect(result.b).toEqual({ pairs: [["disk", "sda"]], rest: [], ambiguous: false })
    expect(result.c).toEqual({ pairs: [["disk", "sdb"]], rest: [], ambiguous: false })
  })

  it("does not separate two rows that both miss a label", () => {
    const row = (id, labels) => ({ id, context: "disk.io", node: "n1", labels })
    const rows = [
      row("a", { disk: "sda", part: "1" }),
      row("b", { disk: "sda" }),
      row("c", { disk: "sdb" }),
    ]

    const result = getIdentifyingLabels(rows, { max: 1 })

    expect(result.a).toEqual({ pairs: [["disk", "sda"]], rest: [["part", "1"]], ambiguous: true })
    expect(result.b.ambiguous).toBe(true)
    expect(result.c).toEqual({ pairs: [["disk", "sdb"]], rest: [], ambiguous: false })
  })

  it("handles rows without labels", () => {
    const rows = [
      { id: "a", context: "c", node: "n1", labels: null },
      { id: "b", context: "c", node: "n2" },
    ]

    expect(getIdentifyingLabels(rows)).toEqual({
      a: { pairs: [], rest: [], ambiguous: false },
      b: { pairs: [], rest: [], ambiguous: false },
    })
  })

  describe("nodes", () => {
    it("is not ambiguous when identical labels live on different nodes", () => {
      const rows = [
        { id: "a", context: "net.net", node: "n1", labels: { device: "eth0", type: "phys" } },
        { id: "b", context: "net.net", node: "n2", labels: { device: "eth0", type: "phys" } },
      ]

      expect(getIdentifyingLabels(rows, { max: 1 })).toEqual({
        a: { pairs: [["device", "eth0"]], rest: [["type", "phys"]], ambiguous: false },
        b: { pairs: [["device", "eth0"]], rest: [["type", "phys"]], ambiguous: false },
      })
    })

    it("shows the top separating labels when the node alone identifies", () => {
      const rows = [
        {
          id: "a",
          context: "net.net",
          node: "n1",
          labels: { device: "eth0", kind: "x", speed: "1" },
        },
        {
          id: "b",
          context: "net.net",
          node: "n2",
          labels: { device: "eth1", kind: "x", speed: "9" },
        },
      ]

      expect(getIdentifyingLabels(rows, { max: 2 }).a).toEqual({
        pairs: [
          ["device", "eth0"],
          ["speed", "1"],
        ],
        rest: [["kind", "x"]],
        ambiguous: false,
      })
    })

    it("uses other nodes to tell rows apart only together with the node", () => {
      const rows = [
        { id: "a", context: "net.net", node: "n1", labels: { device: "eth0", mtu: "1500" } },
        { id: "b", context: "net.net", node: "n1", labels: { device: "eth1", mtu: "1500" } },
        { id: "c", context: "net.net", node: "n2", labels: { device: "eth0", mtu: "9000" } },
      ]

      expect(getIdentifyingLabels(rows, { max: 1 }).c.pairs).toEqual([["device", "eth0"]])
    })
  })

  it("marks rows indistinguishable on the same node as ambiguous", () => {
    const row = (id, labels) => ({ id, context: "app.cpu", node: "n1", labels })
    const rows = [
      row("a", { app: "x", _collect_job: "1" }),
      row("b", { app: "x", _collect_job: "2" }),
      row("c", { app: "y" }),
      row("d", { app: "z" }),
    ]

    const result = getIdentifyingLabels(rows)

    expect(result.a).toEqual({ pairs: [["app", "x"]], rest: [], ambiguous: true })
    expect(result.b.ambiguous).toBe(true)
    expect(result.c).toEqual({ pairs: [["app", "y"]], rest: [], ambiguous: false })
    expect(result.d.ambiguous).toBe(false)
  })

  it("marks rows with identical labels on the same node as ambiguous", () => {
    const row = (id, node) => ({ id, context: "app.cpu", node, labels: { image: "x" } })
    const result = getIdentifyingLabels([row("a", "n1"), row("b", "n1"), row("c", "n2")])

    expect(result.a).toEqual({ pairs: [["image", "x"]], rest: [], ambiguous: true })
    expect(result.b.ambiguous).toBe(true)
    expect(result.c.ambiguous).toBe(false)
  })

  it("shows the top labels of a single instance and keeps the remainder in rest", () => {
    const rows = [
      {
        id: "only",
        context: "k8s.cpu",
        node: "n1",
        labels: { b: "2", a: "1", k8s_pod_name: "p", d: "4", _hidden: "h" },
      },
    ]

    expect(getIdentifyingLabels(rows).only).toEqual({
      pairs: [
        ["k8s_pod_name", "p"],
        ["a", "1"],
        ["b", "2"],
      ],
      rest: [["d", "4"]],
      ambiguous: false,
    })
  })

  it("falls back to the first labels by priority when no set within max identifies, marking rows the shown labels cannot tell apart", () => {
    const rows = Array.from({ length: 16 }, (_, index) => ({
      id: `r${index}`,
      context: "bits",
      node: "n1",
      labels: {
        w: `${index & 1}`,
        x: `${(index >> 1) & 1}`,
        y: `${(index >> 2) & 1}`,
        z: `${(index >> 3) & 1}`,
      },
    }))

    expect(getIdentifyingLabels(rows).r5).toEqual({
      pairs: [
        ["w", "1"],
        ["x", "0"],
        ["y", "1"],
      ],
      rest: [["z", "0"]],
      ambiguous: true,
    })
    expect(getIdentifyingLabels(rows).r13).toMatchObject({ rest: [["z", "1"]], ambiguous: true })
  })

  it("identifies each context independently", () => {
    const rows = [
      { id: "a1", context: "a", node: "n1", labels: { disk: "sda", mode: "r" } },
      { id: "a2", context: "a", node: "n1", labels: { disk: "sda", mode: "w" } },
      { id: "b1", context: "b", node: "n1", labels: { disk: "sda", mode: "r" } },
      { id: "b2", context: "b", node: "n1", labels: { disk: "sdb", mode: "r" } },
    ]

    const result = getIdentifyingLabels(rows, { max: 1 })

    expect(result.a1).toEqual({ pairs: [["mode", "r"]], rest: [["disk", "sda"]], ambiguous: false })
    expect(result.b1).toEqual({ pairs: [["disk", "sda"]], rest: [["mode", "r"]], ambiguous: false })
  })

  it("stays fast on a large context", () => {
    const rows = Array.from({ length: 10000 }, (_, index) => ({
      id: `r${index}`,
      context: "big",
      node: `n${index % 7}`,
      labels: {
        l0: `${index % 10}`,
        l1: `${index % 3}`,
        l2: `${index % 5}`,
        l3: `${index % 2}`,
        l4: `${index % 4}`,
        l5: "const",
        l6: `${index % 6}`,
        l7: `${index % 9}`,
      },
    }))

    const start = performance.now()
    const result = getIdentifyingLabels(rows)
    const elapsed = performance.now() - start

    expect(Object.keys(result)).toHaveLength(10000)
    expect(elapsed).toBeLessThan(1000)
  })
})
