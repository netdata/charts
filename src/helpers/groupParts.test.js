import { act } from "@testing-library/react"
import { makeTestChart } from "@jest/testUtilities"
import makeInterfacePayload, { machineGuid, nodeId } from "../../fixtures/makeInterfacePayload"
import { getLevels, findNode, getGroupParts, triggerGroupClick } from "./groupParts"

const trafficId = `in,Gi0/1,ethernetCsmacd,${machineGuid},snmp.device_prof_ifTraffic`

const makeChart = async payload => {
  const { chart } = makeTestChart({
    mockData: payload,
    attributes: { contextScope: ["snmp.device_prof_ifTraffic"], chartLibrary: "table" },
  })
  await act(async () => {
    await chart.fetch()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  return chart
}

describe("group parts", () => {
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

  it("decodes every grouped level and resolves the node id", async () => {
    const chart = await makeChart(makeInterfacePayload())

    expect(getGroupParts(chart, trafficId)).toEqual({
      dimension: "in",
      labels: { interface: "Gi0/1", if_type: "ethernetCsmacd" },
      node: nodeId,
      context: "snmp.device_prof_ifTraffic",
    })
  })

  it("leaves out omitted level kinds", async () => {
    const chart = await makeChart(makeInterfacePayload())

    expect(getGroupParts(chart, trafficId, { omit: ["context", "dimension"] })).toEqual({
      labels: { interface: "Gi0/1", if_type: "ethernetCsmacd" },
      node: nodeId,
    })
  })

  it("keeps commas inside label values when the payload has per dimension labels", async () => {
    const chart = await makeChart(
      makeInterfacePayload({
        interfaces: [{ name: "Po1,sub", type: "ieee8023adLag", alias: "lag" }],
      })
    )
    const id = `out,Po1,sub,ieee8023adLag,${machineGuid},snmp.device_prof_ifErrors`

    expect(getGroupParts(chart, id)).toEqual({
      dimension: "out",
      labels: { interface: "Po1,sub", if_type: "ieee8023adLag" },
      node: nodeId,
      context: "snmp.device_prof_ifErrors",
    })
  })

  it("splits the id when the payload has no per dimension labels", async () => {
    const chart = await makeChart(makeInterfacePayload({ labels: false }))

    expect(getGroupParts(chart, trafficId).labels).toEqual({
      interface: "Gi0/1",
      if_type: "ethernetCsmacd",
    })
  })

  it("skips unset labels and placeholder groups", async () => {
    const chart = await makeChart(
      makeInterfacePayload({
        interfaces: [{ name: "[unset]", type: "ethernetCsmacd", alias: "" }],
      })
    )
    const id = `in,[unset],ethernetCsmacd,${machineGuid},snmp.device_prof_ifTraffic`

    expect(getGroupParts(chart, id).labels).toEqual({ if_type: "ethernetCsmacd" })
    expect(getGroupParts(chart, "OTHERS")).toEqual({ labels: {} })
    expect(getGroupParts(chart, "__hidden_dimensions__")).toEqual({ labels: {} })
  })

  it("emits groupClick only for a real group", async () => {
    const chart = await makeChart(makeInterfacePayload())
    const trigger = jest.spyOn(chart.sdk, "trigger")

    triggerGroupClick(chart, { source: "table", groupId: "others", dimensionIds: ["OTHERS"] })
    triggerGroupClick(chart, { source: "table", groupId: "empty", dimensionIds: [] })
    triggerGroupClick(chart, { source: "table", groupId: "missing" })
    expect(trigger).not.toHaveBeenCalledWith("groupClick", expect.anything(), expect.anything())

    triggerGroupClick(chart, { source: "table", groupId: "row", dimensionIds: [trafficId] })
    expect(trigger).toHaveBeenCalledWith(
      "groupClick",
      chart,
      expect.objectContaining({ source: "table", groupId: "row", dimensionIds: [trafficId] })
    )
  })

  it("does not take an empty per dimension label as the label value", async () => {
    const chart = await makeChart(makeInterfacePayload())
    const viewDimensions = chart.getAttribute("viewDimensions")
    const index = chart.getDimensionIndex(trafficId)
    const interfaces = [...viewDimensions.labels.interface]
    interfaces[index] = ["", "Gi0/1.100"]
    chart.updateAttribute("viewDimensions", {
      ...viewDimensions,
      labels: { ...viewDimensions.labels, interface: interfaces },
    })

    expect(getGroupParts(chart, trafficId).labels.interface).toBe("Gi0/1.100")
  })
})
