import { act, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart, simulateTranslate } from "@jest/testUtilities"
import { makePayload, makeWave } from "../../../../fixtures/makeWavePayload"
import Header from "@/components/header"

const positive = center => makeWave({ center, amplitude: center / 4 })
const negative = center => makeWave({ center: -center, amplitude: center / 4 })

const dimension = (id, values) => ({ id, values })

const payloadOf = ({
  context = "disk.io",
  dimensions,
  summaryDimensions,
  labels = [],
  nodes = 1,
  instances = 1,
  instancesPerNode,
  aggregated,
}) => {
  const payload = makePayload({ context, title: context, unit: "KiB/s", dimensions })

  return {
    ...payload,
    ...(aggregated && {
      view: { ...payload.view, dimensions: { ...payload.view.dimensions, aggregated } },
    }),
    summary: {
      ...payload.summary,
      ...(instancesPerNode && {
        nodes: instancesPerNode.map((count, index) => ({
          ni: index,
          nd: `node-${index}`,
          mg: `machine-${index}`,
          nm: `web-0${index + 1}`,
          is: { sl: count, qr: count },
        })),
      }),
      ...(summaryDimensions && {
        dimensions: summaryDimensions.map(id => ({ id, sts: { min: 0, max: 1, avg: 1, con: 0 } })),
      }),
      labels,
    },
    totals: { nodes: { sl: nodes, qr: nodes }, instances: { sl: instances, qr: instances } },
  }
}

const readsAndWrites = [dimension("reads", positive(80)), dimension("writes", negative(40))]

const cpuDimensions = ["user", "system", "nice", "iowait", "irq"]

const renderLine = async ({ attributes = {}, payload, hasFilters = true } = {}) => {
  const { aggregationMethod, ...sdkAttributes } = attributes
  const { chart, sdk } = makeTestChart({
    attributes: { designFlavour: "modern", title: "Chart", locale: "en-US", ...sdkAttributes },
    ...(payload && { mockData: payload }),
  })
  if (aggregationMethod) chart.updateAttribute("aggregationMethod", aggregationMethod)
  const result = renderWithChart(<Header hasFilters={hasFilters} />, { chart })
  await act(async () => {
    chart.fetch()
  })
  await waitFor(() => expect(chart.getAttribute("loaded")).toBe(true))
  return { ...result, chart, sdk }
}

const line = () => {
  const element = screen.getByTestId("chartScopeLine")
  expect(element.textContent).not.toMatch(/\bline/i)
  return element
}

describe("Modern scope line sentence", () => {
  it("says what the chart shows, with no lock and no query summary", async () => {
    await renderLine()

    expect(line()).toHaveTextContent(/^Load1, load5 and load15$/)
    expect(screen.queryByTestId("chartScopeLine-lock")).not.toBeInTheDocument()
    expect(screen.queryByText(/Group by/)).not.toBeInTheDocument()
  })

  it("says how many instances the dimensions add up and which stays below zero", async () => {
    await renderLine({
      attributes: { contextScope: ["disk.io"], groupBy: ["dimension"], aggregationMethod: "sum" },
      payload: payloadOf({ dimensions: readsAndWrites, nodes: 3, instances: 6 }),
    })

    expect(line()).toHaveTextContent(
      /^Reads and writes of 6 instances, added up · writes below zero$/
    )
  })

  it("names the nodes and how many instances each adds up when grouped by node", async () => {
    await renderLine({
      attributes: { contextScope: ["disk.io"], groupBy: ["node"], aggregationMethod: "sum" },
      payload: payloadOf({
        dimensions: ["web-01", "web-02", "web-03"].map(id => dimension(id, positive(50))),
        summaryDimensions: ["reads", "writes"],
        nodes: 3,
        instances: 6,
        instancesPerNode: [2, 2, 2],
      }),
    })

    expect(line()).toHaveTextContent(
      /^Per node: web-01, web-02, web-03 · each adds up 2 instances$/
    )
  })

  it("does not average the instances over nodes that hold different counts", async () => {
    await renderLine({
      attributes: { contextScope: ["disk.io"], groupBy: ["node"], aggregationMethod: "sum" },
      payload: payloadOf({
        dimensions: ["web-01", "web-02"].map(id => dimension(id, positive(50))),
        summaryDimensions: ["reads", "writes"],
        nodes: 2,
        instances: 6,
        instancesPerNode: [5, 1],
        aggregated: [10, 2],
      }),
    })

    expect(line()).toHaveTextContent(/^Per node: web-01, web-02 · each adds up its instances$/)
  })

  it("counts the instances behind each series when grouped by node and dimension", async () => {
    await renderLine({
      attributes: {
        contextScope: ["disk.io"],
        groupBy: ["node", "dimension"],
        aggregationMethod: "sum",
      },
      payload: payloadOf({
        dimensions: ["web-01 reads", "web-01 writes", "web-02 reads", "web-02 writes"].map(id =>
          dimension(id, positive(50))
        ),
        summaryDimensions: ["reads", "writes"],
        nodes: 2,
        instances: 8,
        instancesPerNode: [4, 4],
        aggregated: [4, 4, 4, 4],
      }),
    })

    expect(line()).toHaveTextContent(/· each adds up 4 instances$/)
  })

  it("does not count metrics as instances when a label groups several dimensions", async () => {
    await renderLine({
      attributes: { groupBy: ["label"], groupByLabel: ["device_type"], aggregationMethod: "sum" },
      payload: payloadOf({
        dimensions: ["physical", "virtual"].map(id => dimension(id, positive(50))),
        summaryDimensions: ["reads", "writes"],
        instances: 4,
        aggregated: [4, 4],
      }),
    })

    expect(line()).toHaveTextContent(
      /^Per device_type: physical, virtual · each adds up its instances$/
    )
  })

  it("uses the chart's noun and the aggregation verb for each grouped member", async () => {
    await renderLine({
      attributes: {
        groupBy: ["node"],
        aggregationMethod: "avg",
        scopeCombines: { noun: "disks" },
      },
      payload: payloadOf({
        dimensions: ["web-01", "web-02", "web-03"].map(id => dimension(id, positive(50))),
        nodes: 3,
        instances: 6,
        instancesPerNode: [2, 2, 2],
      }),
    })

    expect(line()).toHaveTextContent(/^Per node: web-01, web-02, web-03 · each averages 2 disks$/)
  })

  it("names the first two values of a label and offers the rest on hover", async () => {
    const { user } = await renderLine({
      attributes: { groupBy: ["label"], groupByLabel: ["device"] },
      payload: payloadOf({
        dimensions: ["sda", "sdb", "sdc", "sdd", "sde"].map(id => dimension(id, positive(50))),
        instances: 5,
      }),
    })

    expect(line()).toHaveTextContent(/^Per device: sda, sdb and 3 more$/)
    await user.hover(screen.getByTestId("chartScope"))
    expect(await screen.findByText("sdc, sdd, sde")).toBeInTheDocument()
  })

  it("names the consumer's singular noun when grouped by instance", async () => {
    const { user } = await renderLine({
      attributes: {
        groupBy: ["instance"],
        scopeCombines: { noun: "disks", nounSingular: "disk" },
      },
      payload: payloadOf({
        dimensions: ["sda", "sdb", "sdc", "sdd", "sde"].map(id => dimension(id, positive(50))),
        instances: 5,
      }),
    })

    expect(line()).toHaveTextContent(/^Per disk: sda, sdb and 3 more$/)
    await user.hover(screen.getByTestId("chartScope"))
    expect(await screen.findByText("sdc, sdd, sde")).toBeInTheDocument()
  })

  it("falls back to instance when grouped by instance without a noun", async () => {
    await renderLine({
      attributes: { groupBy: ["instance"] },
      payload: payloadOf({
        dimensions: ["sda", "sdb"].map(id => dimension(id, positive(50))),
        instances: 2,
      }),
    })

    expect(line()).toHaveTextContent(/^Per instance: sda, sdb$/)
  })

  it("names the label key when grouped by a label", async () => {
    await renderLine({
      attributes: { groupBy: ["label"], groupByLabel: ["device_type"] },
      payload: payloadOf({
        dimensions: ["physical", "virtual"].map(id => dimension(id, positive(50))),
        instances: 2,
      }),
    })

    expect(line()).toHaveTextContent(/^Per device_type: physical, virtual$/)
  })

  it("counts nodes when every node has one instance", async () => {
    await renderLine({
      attributes: { aggregationMethod: "avg" },
      payload: payloadOf({
        context: "system.cpu",
        dimensions: cpuDimensions.slice(0, 2).map(id => dimension(id, positive(20))),
        nodes: 3,
        instances: 3,
      }),
    })

    expect(line()).toHaveTextContent(/^User and system of 3 nodes, averaged$/)
  })

  it("names the first two dimensions and offers the rest on hover when there are four or more", async () => {
    const { user } = await renderLine({
      payload: payloadOf({
        context: "system.cpu",
        dimensions: cpuDimensions.map(id => dimension(id, positive(20))),
      }),
    })

    expect(line()).toHaveTextContent(/^User, system and 3 more$/)
    await user.hover(screen.getByTestId("chartScope"))
    expect(await screen.findByText("nice, iowait, irq")).toBeInTheDocument()
  })

  it("uses the chart's noun and lock, with a label filter inside the combined phrase", async () => {
    await renderLine({
      attributes: {
        contextScope: ["disk.io"],
        aggregationMethod: "sum",
        selectedLabels: ["device_type:physical"],
        scopeCombines: { noun: "disks" },
        scopeLock: { label: "web-03" },
      },
      payload: payloadOf({
        dimensions: readsAndWrites,
        labels: [{ id: "device_type", vl: [{ id: "physical" }, { id: "virtual" }] }],
        instances: 3,
      }),
    })

    expect(line()).toHaveTextContent(
      /^Reads and writes of 3 physical disks on web-03, added up · writes below zero$/
    )
    expect(screen.getByTestId("chartScopeLine-lock")).toHaveTextContent(/^web-03$/)
    expect(
      screen.getByRole("button", { name: "Remove filter device_type: physical" })
    ).toBeInTheDocument()
  })

  it("shows the lock on a chart whose dimensions are not combined", async () => {
    await renderLine({ attributes: { scopeLock: { label: "sda" } } })

    expect(line()).toHaveTextContent(/^Load1, load5 and load15 on sda$/)
  })

  it("says an upstream group adds up all its members, without a count", async () => {
    await renderLine({
      attributes: { scopeCombines: { noun: "processes", upstream: true } },
      payload: payloadOf({
        context: "app.cpu_utilization",
        dimensions: cpuDimensions.slice(0, 2).map(id => dimension(id, positive(20))),
      }),
    })

    expect(line()).toHaveTextContent(/^User and system of all processes, added up$/)
  })

  describe("filters", () => {
    const filteredCpu = selectedDimensions =>
      renderLine({
        attributes: { selectedDimensions },
        payload: payloadOf({
          context: "system.cpu",
          dimensions: selectedDimensions.map(id => dimension(id, positive(20))),
          summaryDimensions: cpuDimensions,
        }),
      })

    it("says what a dimension filter keeps and hides", async () => {
      await filteredCpu(["user"])

      expect(line()).toHaveTextContent(/^User · only user hides system, nice and 2 more$/)
    })

    it("says all except the hidden dimension when most are kept", async () => {
      await filteredCpu(cpuDimensions.slice(0, 4))

      expect(screen.getByTestId("chartScopeLine-dimensions")).toHaveTextContent(/^all except irq$/)
      expect(screen.queryByTestId("chartScopeLine-dimensions-hides")).not.toBeInTheDocument()
    })

    it("removes a dimension filter through the chart's filter controls", async () => {
      const { user, chart } = await filteredCpu(["user"])

      await user.click(screen.getByRole("button", { name: "Remove filter only user" }))

      expect(chart.getAttribute("selectedDimensions")).toEqual([])
      expect(chart.getAttribute("filtersOpen")).toBeFalsy()
      await waitFor(() =>
        expect(screen.queryByTestId("chartScopeLine-dimensions")).not.toBeInTheDocument()
      )
    })

    const labelled = attributes =>
      renderLine({
        attributes: {
          selectedLabels: ["device_type:physical", "mount_point:/"],
          ...attributes,
        },
        payload: payloadOf({
          dimensions: readsAndWrites,
          labels: [
            { id: "device_type", vl: [{ id: "physical" }, { id: "virtual" }] },
            { id: "mount_point", vl: [{ id: "/" }, { id: "/boot" }] },
          ],
        }),
      })

    it("says what a label filter keeps and hides", async () => {
      await labelled()

      expect(line()).toHaveTextContent(
        /^Reads and writes · writes below zero · device_type: only physical hides virtual · mount_point: only \/ hides \/boot$/
      )
    })

    it("removes only that label key's filter through the chart's filter controls", async () => {
      const { user, chart } = await labelled()

      await user.click(
        screen.getByRole("button", { name: "Remove filter device_type: only physical" })
      )

      expect(chart.getAttribute("selectedLabels")).toEqual(["mount_point:/"])
    })

    it("hands the removed filters to the consumer when it owns them", async () => {
      const { user, chart, sdk } = await labelled({ scopeFilterRemove: true })
      const onChart = jest.fn()
      const onSdk = jest.fn()
      chart.on("scopeFilterRemove", onChart)
      sdk.on("scopeFilterRemove", onSdk)

      await user.click(
        screen.getByRole("button", { name: "Remove filter device_type: only physical" })
      )

      const removed = [{ matchType: "labels", value: "device_type:physical" }]
      expect(onChart).toHaveBeenCalledWith(removed, "scopeFilterRemove")
      expect(onSdk).toHaveBeenCalledWith(chart, removed, "scopeFilterRemove")
      expect(chart.getAttribute("selectedLabels")).toEqual([
        "device_type:physical",
        "mount_point:/",
      ])
    })
  })

  it("opens the filters from the sentence", async () => {
    const { user, chart } = await renderLine()

    await user.click(screen.getByTestId("chartScope"))

    expect(chart.getAttribute("filtersOpen")).toBe(true)
  })

  it("survives page translation wrapping every text node", async () => {
    const { chart, container } = await renderLine({
      attributes: { scopeLock: { label: "web-03" }, selectedDimensions: ["load1"] },
    })

    simulateTranslate(container)
    act(() => chart.updateAttributes({ selectedDimensions: [], scopeLock: null }))

    await waitFor(() => expect(line()).toHaveTextContent(/^Load1, load5 and load15$/))
  })
})
