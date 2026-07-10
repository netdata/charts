import { makeTestChart } from "@jest/testUtilities"
import { transformWeightsData, buildHierarchicalTree } from "./dataTransformer"

const firstNodeId = "9d445810-58a2-4d8c-9749-d80785f49d93"

const { chart } = makeTestChart({
  attributes: {
    nodes: {
      "lab-cloud-unpaid": { nm: "Production node" },
    },
  },
})

const weightsResponse = {
  result: [
    {
      id: `load1,system.load,${firstNodeId}`,
      nm: "load1,system.load,lab-cloud-unpaid",
      v: [
        [0.3837659, 0.3837659, 0.3837659, 0.3837659, 1],
        [0.05, 0.3837659, 2, 69.0778583, 180, 0],
      ],
    },
    {
      id: `load5,system.load,${firstNodeId}`,
      nm: "load5,system.load,lab-cloud-unpaid",
      v: [
        [0.3523553, 0.3523553, 0.3523553, 0.3523553, 1],
        [0.14, 0.3523553, 0.64, 63.4239464, 180, 0],
      ],
    },
    {
      id: "load1,system.load,b6d0e457-0281-4ef9-8c20-86bcbeffd1a8",
      nm: "load1,system.load,nd-child-unpaid04",
      v: [
        [0.3889211, 0.3889211, 0.3889211, 0.3889211, 1],
        [0.05, 0.3889211, 1.84, 70.0058063, 180, 0],
      ],
    },
  ],
}

const makeTreeItem = (
  {
    values,
    names = values,
    nm = names.join(","),
    weight = { min: 1, avg: 1, max: 1, sum: 1, count: 1 },
    timeframe = { min: 1, avg: 1, max: 1, sum: 1, count: 1, anomaly_count: 0 },
  },
  groupByOrder
) => {
  const groupedBy = groupByOrder.reduce((result, field, index) => {
    result[field] = values[index]
    return result
  }, {})
  const groupedByNames = groupByOrder.reduce((result, field, index) => {
    result[field] = names[index]
    return result
  }, {})

  return {
    id: values.join(","),
    nm,
    label: names[0],
    groupedBy,
    groupedByNames,
    weight,
    timeframe,
    anomalyRate: timeframe.count > 0 ? (timeframe.anomaly_count * 100) / timeframe.count : 0,
    contribution: weight.sum,
    level: 0,
    parentId: null,
  }
}

const countTreeNodes = nodes =>
  nodes.reduce((count, node) => count + 1 + countTreeNodes(node.children || []), 0)

describe("dataTransformer", () => {
  describe("transformWeightsData", () => {
    it("returns empty array when no data", () => {
      expect(transformWeightsData(null, ["dimension"], chart)).toEqual([])
      expect(transformWeightsData({ result: [] }, ["dimension"], chart)).toEqual([])
      expect(transformWeightsData(weightsResponse, [], chart)).toEqual([])
    })

    it("transforms weights response to flat data", () => {
      const groupBy = ["dimension", "context", "node"]
      const result = transformWeightsData(weightsResponse, groupBy, chart)

      expect(result).toHaveLength(3)

      const firstItem = result[0]
      expect(firstItem.id).toBe(`load1,system.load,${firstNodeId}`)
      expect(firstItem.nm).toBe("load1,system.load,lab-cloud-unpaid")
      expect(firstItem.label).toBe("load1")
      expect(firstItem.groupedBy).toEqual({
        dimension: "load1",
        context: "system.load",
        node: firstNodeId,
      })
      expect(firstItem.groupedByNames).toEqual({
        dimension: "load1",
        context: "system.load",
        node: "Production node",
      })
    })

    it("maps weight statistics correctly", () => {
      const groupBy = ["dimension", "context", "node"]
      const result = transformWeightsData(weightsResponse, groupBy, chart)

      expect(result[0].weight).toEqual({
        min: 0.3837659,
        avg: 0.3837659,
        max: 0.3837659,
        sum: 0.3837659,
        count: 1,
      })
    })

    it("maps timeframe statistics correctly", () => {
      const groupBy = ["dimension", "context", "node"]
      const result = transformWeightsData(weightsResponse, groupBy, chart)

      expect(result[0].timeframe).toEqual({
        min: 0.05,
        avg: 0.3837659,
        max: 2,
        sum: 69.0778583,
        count: 180,
        anomaly_count: 0,
      })
    })

    it("uses schema indexes and sanitizes non-finite timeframe statistics", () => {
      const response = {
        v_schema: {
          items: [{ name: "timeframe" }, { name: "weight" }],
        },
        result: [
          {
            id: "dimension",
            nm: "Dimension",
            v: [
              [Infinity, -Infinity, NaN, undefined, null, Infinity],
              [1, 2, 3, 4, 5],
            ],
          },
        ],
      }

      const [result] = transformWeightsData(response, ["dimension"], chart)

      expect(result.weight).toEqual({ min: 1, avg: 2, max: 3, sum: 4, count: 5 })
      expect(result.timeframe).toEqual({
        min: null,
        avg: null,
        max: null,
        sum: null,
        count: null,
        anomaly_count: null,
      })
      expect(result.anomalyRate).toBe(0)
    })

    it("calculates anomaly rate correctly", () => {
      const groupBy = ["dimension", "context", "node"]
      const response = {
        result: [
          {
            id: "test,test,test",
            nm: "test",
            v: [
              [1, 1, 1, 1, 1],
              [1, 1, 1, 1, 100, 10],
            ],
          },
        ],
      }

      expect(transformWeightsData(weightsResponse, groupBy, chart)[0].anomalyRate).toBe(0)
      expect(transformWeightsData(response, groupBy, chart)[0].anomalyRate).toBe(10)
    })

    it("handles different groupBy orders", () => {
      const groupBy = ["node", "dimension", "context"]
      const result = transformWeightsData(weightsResponse, groupBy, chart)

      expect(result[0].label).toBe("load1")
      expect(result[0].groupedBy).toEqual({
        node: "load1",
        dimension: "system.load",
        context: firstNodeId,
      })
    })
  })

  describe("buildHierarchicalTree", () => {
    it("returns the original flat data when no groupBy order is provided", () => {
      const flatData = [{ id: "test", level: 0 }]

      expect(buildHierarchicalTree(flatData, [])).toBe(flatData)
    })

    it("builds the hierarchy with stable parent-child order", () => {
      const groupBy = ["dimension", "context", "node"]
      const flatData = transformWeightsData(weightsResponse, groupBy, chart)
      const tree = buildHierarchicalTree(flatData, groupBy)

      expect(tree.map(node => node.label)).toEqual(["load1", "load5"])

      const [load1Group, load5Group] = tree
      expect(load1Group).toMatchObject({ level: 0, parentId: null, isGroupNode: true })
      expect(load5Group).toMatchObject({ level: 0, parentId: null, isGroupNode: true })
      expect(load1Group.children).toHaveLength(1)

      const [contextGroup] = load1Group.children
      expect(contextGroup).toMatchObject({
        label: "system.load",
        level: 1,
        parentId: "load1",
        isGroupNode: true,
      })
      expect(contextGroup.children.map(node => node.label)).toEqual([
        "Production node",
        "nd-child-unpaid04",
      ])
      expect(contextGroup.children.every(node => !node.isGroupNode)).toBe(true)
    })

    it("preserves exact aggregate semantics for nested groups and duplicate leaves", () => {
      const groupBy = ["region", "node", "dimension"]
      const flatData = [
        makeTreeItem(
          {
            values: ["west", "node-a", "cpu"],
            nm: "cpu",
            weight: { min: 1, avg: 5, max: 5, sum: 10, count: 2 },
            timeframe: { min: 2, avg: 4, max: 6, sum: 8, count: 2, anomaly_count: 1 },
          },
          groupBy
        ),
        makeTreeItem(
          {
            values: ["west", "node-a", "memory"],
            nm: "memory-first",
            weight: { min: null, avg: 20, max: 8, sum: 20, count: 0 },
            timeframe: {
              min: null,
              avg: 10,
              max: 12,
              sum: 20,
              count: 3,
              anomaly_count: 2,
            },
          },
          groupBy
        ),
        makeTreeItem(
          {
            values: ["west", "node-a", "memory"],
            nm: "memory-last",
            weight: { min: 0, avg: 5, max: null, sum: 5, count: 1 },
            timeframe: { min: 1, avg: 2, max: null, sum: 2, count: 1, anomaly_count: 0 },
          },
          groupBy
        ),
        makeTreeItem(
          {
            values: ["west", "node-b", "disk"],
            nm: "disk",
            weight: { min: -1, avg: 0, max: 9, sum: 0, count: 4 },
            timeframe: { min: 0, avg: 0, max: 0, sum: 0, count: 0, anomaly_count: 3 },
          },
          groupBy
        ),
        makeTreeItem({ values: ["east", "node-c", "network"] }, groupBy),
      ]

      const tree = buildHierarchicalTree(flatData, groupBy)
      const [west] = tree
      const [nodeA, nodeB] = west.children

      expect(west.weight).toEqual({
        min: -1,
        max: 9,
        sum: 35,
        avg: 35 / 3,
        count: 7,
        anomaly_count: undefined,
      })
      expect(west.timeframe).toEqual({
        min: 0,
        max: 12,
        sum: 30,
        avg: 40 / 6,
        count: 6,
        anomaly_count: 6,
      })
      expect(west).toMatchObject({ contribution: 35, anomalyRate: 100 })

      expect(nodeA.weight).toEqual({
        min: 0,
        max: 8,
        sum: 35,
        avg: 17.5,
        count: 3,
        anomaly_count: undefined,
      })
      expect(nodeA.timeframe).toEqual({
        min: 1,
        max: 12,
        sum: 30,
        avg: 40 / 6,
        count: 6,
        anomaly_count: 3,
      })
      expect(nodeA).toMatchObject({ contribution: 35, anomalyRate: 50 })
      expect(nodeA.children.map(node => node.nm)).toEqual(["cpu", "memory-last"])
      expect(nodeA.children[1].weight).toEqual(flatData[2].weight)

      expect(nodeB.timeframe).toEqual({
        min: 0,
        max: 0,
        sum: 0,
        avg: 0,
        count: 0,
        anomaly_count: 3,
      })
      expect(nodeB.anomalyRate).toBe(0)
    })

    it("keeps aggregate membership distinct when public path keys collide", () => {
      const groupBy = ["first", "second", "leaf"]
      const firstItem = makeTreeItem(
        {
          values: ["a|b", "c", "leaf-a"],
          nm: "leaf-a",
          weight: { min: 1, avg: 2, max: 3, sum: 2, count: 1 },
          timeframe: { min: 1, avg: 2, max: 3, sum: 2, count: 1, anomaly_count: 1 },
        },
        groupBy
      )
      const secondItem = makeTreeItem(
        {
          values: ["a", "b|c", "leaf-b"],
          nm: "leaf-b",
          weight: { min: 100, avg: 100, max: 100, sum: 100, count: 1 },
          timeframe: {
            min: 100,
            avg: 100,
            max: 100,
            sum: 100,
            count: 1,
            anomaly_count: 0,
          },
        },
        groupBy
      )

      const tree = buildHierarchicalTree([firstItem, secondItem], groupBy)
      const [firstRoot, secondRoot] = tree
      const [collidingGroup] = firstRoot.children

      expect(tree.map(node => node.id)).toEqual(["a|b", "a"])
      expect(collidingGroup.id).toBe("a|b|c")
      expect(collidingGroup.children.map(node => node.nm)).toEqual(["leaf-a", "leaf-b"])
      expect(collidingGroup.weight).toEqual({
        min: 1,
        max: 3,
        sum: 2,
        avg: 2,
        count: 1,
        anomaly_count: undefined,
      })
      expect(collidingGroup.timeframe).toEqual({
        min: 1,
        max: 3,
        sum: 2,
        avg: 2,
        count: 1,
        anomaly_count: 1,
      })
      expect(secondRoot.weight.sum).toBe(100)
      expect(secondRoot.children).toEqual([])
    })

    it("preserves strict-equality membership behavior for NaN grouping values", () => {
      const groupBy = ["group", "leaf"]
      const flatData = [makeTreeItem({ values: [NaN, "dimension"] }, groupBy)]

      const [group] = buildHierarchicalTree(flatData, groupBy)

      expect(group.id).toBe("NaN")
      expect(group.children).toHaveLength(1)
      expect(group).not.toHaveProperty("weight")
      expect(group).not.toHaveProperty("timeframe")
    })

    it("handles grouping values that match object prototype property names", () => {
      const groupBy = ["group", "leaf"]
      const flatData = [
        makeTreeItem({ values: ["__proto__", "constructor"], nm: "prototype leaf" }, groupBy),
      ]

      const [group] = buildHierarchicalTree(flatData, groupBy)

      expect(group).toMatchObject({
        id: "__proto__",
        label: "__proto__",
        isGroupNode: true,
      })
      expect(group.children).toHaveLength(1)
      expect(group.children[0]).toMatchObject({
        id: "__proto__|constructor",
        nm: "prototype leaf",
        isGroupNode: false,
      })
    })

    it("preserves object property ordering for integer-like root keys", () => {
      const groupBy = ["group", "leaf"]
      const flatData = ["10", "2", "alpha"].map(value =>
        makeTreeItem({ values: [value, `leaf-${value}`] }, groupBy)
      )

      const tree = buildHierarchicalTree(flatData, groupBy)

      expect(tree.map(node => node.id)).toEqual(["2", "10", "alpha"])
    })

    it("handles single-level grouping", () => {
      const groupBy = ["dimension"]
      const flatData = transformWeightsData(weightsResponse, groupBy, chart)
      const tree = buildHierarchicalTree(flatData, groupBy)

      expect(tree.map(node => node.label)).toEqual(["load1", "load5"])
      expect(tree.every(node => !node.isGroupNode)).toBe(true)
    })

    it("builds and exactly aggregates a 6,000-row high-cardinality hierarchy", () => {
      const groupBy = ["region", "cluster", "node", "dimension"]
      const flatData = Array.from({ length: 6000 }, (_, index) => {
        const region = Math.floor(index / 600)
        const cluster = Math.floor((index % 600) / 30)
        const node = index % 30
        const value = index + 1

        return makeTreeItem(
          {
            values: [
              `region-${region}`,
              `cluster-${cluster}`,
              `node-${node}`,
              `dimension-${index}`,
            ],
            weight: {
              min: value - 0.5,
              avg: value,
              max: value + 0.5,
              sum: value,
              count: index % 4 === 0 ? 0 : 2,
            },
            timeframe: {
              min: value - 1,
              avg: value,
              max: value + 1,
              sum: value * 2,
              count: 2,
              anomaly_count: index % 3 === 0 ? 1 : 0,
            },
          },
          groupBy
        )
      })

      const tree = buildHierarchicalTree(flatData, groupBy)
      const region = tree[0]
      const cluster = region.children[0]
      const node = cluster.children[1]

      expect(tree.map(item => item.label)).toEqual(
        Array.from({ length: 10 }, (_, index) => `region-${index}`)
      )
      expect(countTreeNodes(tree)).toBe(12210)
      expect(region.children.map(item => item.label)).toEqual(
        Array.from({ length: 20 }, (_, index) => `cluster-${index}`)
      )
      expect(cluster.children.map(item => item.label)).toEqual(
        Array.from({ length: 30 }, (_, index) => `node-${index}`)
      )

      expect(region.weight).toEqual({
        min: 0.5,
        max: 600.5,
        sum: 180300,
        avg: 180300 / 450,
        count: 900,
        anomaly_count: undefined,
      })
      expect(region.timeframe).toEqual({
        min: 0,
        max: 601,
        sum: 360600,
        avg: 300.5,
        count: 1200,
        anomaly_count: 200,
      })
      expect(region.anomalyRate).toBe((200 * 100) / 1200)

      expect(cluster.weight).toEqual({
        min: 0.5,
        max: 30.5,
        sum: 465,
        avg: 465 / 22,
        count: 44,
        anomaly_count: undefined,
      })
      expect(cluster.timeframe).toEqual({
        min: 0,
        max: 31,
        sum: 930,
        avg: 15.5,
        count: 60,
        anomaly_count: 10,
      })

      expect(node.weight).toEqual({
        min: 1.5,
        max: 2.5,
        sum: 2,
        avg: 2,
        count: 2,
        anomaly_count: undefined,
      })
      expect(node.timeframe).toEqual({
        min: 1,
        max: 3,
        sum: 4,
        avg: 2,
        count: 2,
        anomaly_count: 0,
      })
      expect(node.children).toHaveLength(1)
      expect(node.children[0].label).toBe("dimension-1")
    })
  })
})
