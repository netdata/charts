import makeHeatPayload from "../../../../fixtures/makeHeatPayload"
import { getLevels, findNode, getBoxIds, buildBoxTree, findGroup } from "./tree"

describe("group boxes tree", () => {
  it("reads level kinds from grouped", () => {
    expect(getLevels(["dimension", "label:k8s_namespace", "node"])).toEqual([
      { kind: "dimension", key: "dimension" },
      { kind: "label", key: "k8s_namespace" },
      { kind: "node", key: "node" },
    ])
    expect(getLevels(undefined)).toEqual([])
  })

  it("finds nodes by machine guid or node id", () => {
    const nodes = { n1: { mg: "mg-1", nd: "n1", nm: "web-1" }, "mg-2": { mg: "mg-2", nm: "db" } }
    expect(findNode(nodes, "mg-1")).toEqual({ key: "n1", node: nodes.n1 })
    expect(findNode(nodes, "mg-2")).toEqual({ key: "mg-2", node: nodes["mg-2"] })
    expect(findNode(nodes, "nope")).toBeNull()
  })

  it("takes box ids from the payload labels without time and the appended columns", () => {
    const ids = getBoxIds({ labels: ["time", "a,1", "a,2", "ANOMALY_RATE", "ANNOTATIONS"] })
    expect(ids).toEqual(["a,1", "a,2"])
  })

  it("nests every level but the last and keeps boxes as leaves", () => {
    const nodes = { n1: { mg: "mg-1", nd: "n1", nm: "web-1" } }
    const root = buildBoxTree(
      ["mon,mg-1,p1", "mon,mg-1,p2", "infra,mg-1,p3"],
      ["label:ns", "node", "label:pod"],
      nodes
    )

    expect(root.count).toBe(3)
    expect(root.children.map(group => group.name)).toEqual(["mon", "infra"])
    const node = root.children[0].children[0]
    expect(node).toMatchObject({ name: "web-1", value: "mg-1", path: ["mon", "mg-1"], count: 2 })
    expect(node.children.map(leaf => leaf.id)).toEqual(["mon,mg-1,p1", "mon,mg-1,p2"])
    expect(node.children[0]).toMatchObject({
      leaf: true,
      name: "p1",
      level: { kind: "label", key: "pod" },
    })
  })

  it("keeps a box whose value has a comma under the deepest reachable group", () => {
    const root = buildBoxTree(["mon,a,b"], ["label:ns", "label:pod"], {})
    const leaf = root.children[0].children[0]
    expect(leaf).toMatchObject({ id: "mon,a,b", leaf: true, name: "b" })
    expect(root.count).toBe(1)
  })

  it("builds one level of leaves when grouped by one level", () => {
    const root = buildBoxTree(["mon", "infra"], ["label:ns"], {})
    expect(root.children.map(child => child.leaf)).toEqual([true, true])
  })

  it("builds the heat fixture into four groups", () => {
    const payload = makeHeatPayload()
    const ids = payload.result.labels.slice(1)
    const root = buildBoxTree(ids, payload.view.dimensions.grouped_by, {})
    expect(root.children.map(group => `${group.name}(${group.count})`)).toEqual([
      "prod-edge(24)",
      "prod-db(16)",
      "prod-jobs(16)",
      "staging(10)",
    ])
  })

  it("finds groups by path and returns null for a missing path", () => {
    const root = buildBoxTree(["mon,p1"], ["label:ns", "label:pod"], {})
    expect(findGroup(root, [])).toBe(root)
    expect(findGroup(root, ["mon"]).name).toBe("mon")
    expect(findGroup(root, ["gone"])).toBeNull()
  })
})
