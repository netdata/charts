import { transformWeightsData, buildHierarchicalTree } from "./dataTransformer"

const mockChart = {
  getAttribute: jest.fn(() => []),
}

const mockWeightsResponse = {
  result: [
    {
      id: "load1,system.load,9d445810-58a2-4d8c-9749-d80785f49d93",
      nm: "load1,system.load,lab-cloud-unpaid",
      v: [
        [0.3837659, 0.3837659, 0.3837659, 0.3837659, 1],
        [0.05, 0.3837659, 2, 69.0778583, 180, 0],
      ],
    },
    {
      id: "load5,system.load,9d445810-58a2-4d8c-9749-d80785f49d93",
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

describe("dataTransformer", () => {
  describe("transformWeightsData", () => {
    it("returns empty array when no data", () => {
      expect(transformWeightsData(null, ["dimension"], mockChart)).toEqual([])
      expect(transformWeightsData({ result: [] }, ["dimension"], mockChart)).toEqual([])
      expect(transformWeightsData(mockWeightsResponse, [], mockChart)).toEqual([])
    })

    it("transforms weights response to flat data", () => {
      const groupBy = ["dimension", "context", "node"]
      const result = transformWeightsData(mockWeightsResponse, groupBy, mockChart)

      expect(result).toHaveLength(3)

      const firstItem = result[0]
      expect(firstItem.id).toBe("load1,system.load,9d445810-58a2-4d8c-9749-d80785f49d93")
      expect(firstItem.nm).toBe("load1,system.load,lab-cloud-unpaid")
      expect(firstItem.label).toBe("load1")

      expect(firstItem.groupedBy).toEqual({
        dimension: "load1",
        context: "system.load",
        node: "9d445810-58a2-4d8c-9749-d80785f49d93",
      })
    })

    it("maps weight statistics correctly", () => {
      const groupBy = ["dimension", "context", "node"]
      const result = transformWeightsData(mockWeightsResponse, groupBy, mockChart)

      const firstItem = result[0]
      expect(firstItem.weight).toEqual({
        min: 0.3837659,
        avg: 0.3837659,
        max: 0.3837659,
        sum: 0.3837659,
        count: 1,
      })
    })

    it("maps timeframe statistics correctly", () => {
      const groupBy = ["dimension", "context", "node"]
      const result = transformWeightsData(mockWeightsResponse, groupBy, mockChart)

      const firstItem = result[0]
      expect(firstItem.timeframe).toEqual({
        min: 0.05,
        avg: 0.3837659,
        max: 2,
        sum: 69.0778583,
        count: 180,
        anomaly_count: 0,
      })
    })

    it("calculates anomaly rate correctly", () => {
      const groupBy = ["dimension", "context", "node"]
      const result = transformWeightsData(mockWeightsResponse, groupBy, mockChart)

      expect(result[0].anomalyRate).toBe(0)

      const mockWithAnomalies = {
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

      const resultWithAnomalies = transformWeightsData(mockWithAnomalies, groupBy, mockChart)
      expect(resultWithAnomalies[0].anomalyRate).toBe(10)
    })

    it("handles different groupBy orders", () => {
      const groupBy = ["node", "dimension", "context"]
      const result = transformWeightsData(mockWeightsResponse, groupBy, mockChart)

      const firstItem = result[0]
      expect(firstItem.label).toBe("load1")
      expect(firstItem.groupedBy).toEqual({
        node: "load1",
        dimension: "system.load",
        context: "9d445810-58a2-4d8c-9749-d80785f49d93",
      })
    })
  })

  describe("buildHierarchicalTree", () => {
    it("returns flat data when no groupBy order", () => {
      const flatData = [{ id: "test", level: 0 }]
      expect(buildHierarchicalTree(flatData, [])).toEqual(flatData)
    })

    it("builds hierarchical tree structure", () => {
      const groupBy = ["dimension", "context", "node"]
      const flatData = transformWeightsData(mockWeightsResponse, groupBy, mockChart)
      const tree = buildHierarchicalTree(flatData, groupBy)

      expect(tree).toHaveLength(2)

      const load1Group = tree.find(item => item.label === "load1")
      const load5Group = tree.find(item => item.label === "load5")

      expect(load1Group).toBeDefined()
      expect(load5Group).toBeDefined()
      expect(load1Group.isGroupNode).toBe(true)
      expect(load5Group.isGroupNode).toBe(true)
    })

    it("creates proper parent-child relationships", () => {
      const groupBy = ["dimension", "context", "node"]
      const flatData = transformWeightsData(mockWeightsResponse, groupBy, mockChart)
      const tree = buildHierarchicalTree(flatData, groupBy)

      const load1Group = tree.find(item => item.label === "load1")
      expect(load1Group.children).toHaveLength(1)

      const contextGroup = load1Group.children[0]
      expect(contextGroup.label).toBe("system.load")
      expect(contextGroup.level).toBe(1)
      expect(contextGroup.isGroupNode).toBe(true)
      expect(contextGroup.children).toHaveLength(2)

      const leafNode = contextGroup.children[0]
      expect(leafNode.level).toBe(2)
      expect(leafNode.isGroupNode).toBe(false)
    })

    it("handles single level grouping", () => {
      const groupBy = ["dimension"]
      const flatData = transformWeightsData(mockWeightsResponse, groupBy, mockChart)
      const tree = buildHierarchicalTree(flatData, groupBy)

      expect(tree).toHaveLength(2)
      expect(tree[0].label).toBe("load1")
      expect(tree[1].label).toBe("load5")
      expect(tree[0].isGroupNode).toBe(false)
      expect(tree[1].isGroupNode).toBe(false)
    })
  })
})
