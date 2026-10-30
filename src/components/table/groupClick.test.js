import React from "react"
import { act, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import makeInterfacePayload, { machineGuid, nodeId } from "../../../fixtures/makeInterfacePayload"
import { TableChart } from "./index"

const contexts = ["snmp.device_prof_ifTraffic", "snmp.device_prof_ifErrors"]

const renderTable = async ({ designFlavour, ...attributes } = {}) => {
  const { sdk, chart } = makeTestChart({
    mockData: makeInterfacePayload(),
    attributes: {
      contextScope: contexts,
      chartLibrary: "table",
      groupBy: ["label", "dimension", "node", "context"],
      groupByLabel: ["interface", "if_type"],
      ...(designFlavour && { designFlavour }),
      ...attributes,
    },
  })
  await act(async () => {
    await chart.fetch()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  renderWithChart(<TableChart />, { chart })
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 350))
  })
  return { sdk, chart }
}

const rowOf = text => screen.getAllByText(text)[0].closest('[data-testid^="netdata-table-row"]')

describe.each([
  ["classic", undefined],
  ["modern", "modern"],
])("%s table", (_, designFlavour) => {
  it("shows the raw label value without a display mapping", async () => {
    await renderTable({ designFlavour })

    expect(screen.getAllByText("Gi0/1").length).toBeGreaterThan(0)
    expect(screen.queryByText("uplink, core")).not.toBeInTheDocument()
  })

  it("shows the preferred label and falls back to the grouped value", async () => {
    await renderTable({ designFlavour, groupByLabelDisplay: { interface: ["if_alias"] } })

    expect(screen.getAllByText("uplink, core").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Gi0/2").length).toBeGreaterThan(0)
    expect(screen.queryByText("Gi0/1")).not.toBeInTheDocument()
  })

  it("fires groupClick with the decoded row group when enabled", async () => {
    const { sdk } = await renderTable({ designFlavour, groupClickable: true })
    const clicks = []
    const off = sdk.on("groupClick", (chart, payload) => clicks.push(payload))

    fireEvent.click(rowOf("Gi0/1"))
    off()

    expect(clicks).toHaveLength(1)
    const [{ dimensionIds, ...payload }] = clicks
    expect(payload).toEqual({
      source: "table",
      groupId: `Gi0/1,ethernetCsmacd,${machineGuid}`,
      parts: { labels: { interface: "Gi0/1", if_type: "ethernetCsmacd" }, node: nodeId },
    })
    expect([...dimensionIds].sort()).toEqual(
      contexts
        .flatMap(context =>
          ["in", "out"].map(dim => `${dim},Gi0/1,ethernetCsmacd,${machineGuid},${context}`)
        )
        .sort()
    )
  })

  it("does not fire groupClick by default", async () => {
    const { sdk } = await renderTable({ designFlavour })
    const clicks = []
    const off = sdk.on("groupClick", (chart, payload) => clicks.push(payload))

    fireEvent.click(rowOf("Gi0/1"))
    off()

    expect(clicks).toEqual([])
  })
})
