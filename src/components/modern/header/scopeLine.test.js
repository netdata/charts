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
}) => {
  const payload = makePayload({ context, title: context, unit: "KiB/s", dimensions })

  return {
    ...payload,
    summary: {
      ...payload.summary,
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

const line = () => screen.getByTestId("chartScopeLine")

describe("Modern scope line sentence", () => {
  it("says what the lines are, one line each, with no lock and no query summary", async () => {
    await renderLine()

    expect(line()).toHaveTextContent(/^Load1, load5 and load15, one line each$/)
    expect(screen.queryByTestId("chartScopeLine-lock")).not.toBeInTheDocument()
    expect(screen.queryByText(/Group by/)).not.toBeInTheDocument()
  })

  it("says how many instances each dimension line adds up and which stays below zero", async () => {
    await renderLine({
      attributes: { contextScope: ["disk.io"], groupBy: ["dimension"], aggregationMethod: "sum" },
      payload: payloadOf({ dimensions: readsAndWrites, nodes: 3, instances: 6 }),
    })

    expect(line()).toHaveTextContent(
      /^Reads and writes of 6 instances, added up · writes below zero$/
    )
  })

  it("says one line per node when grouped by node", async () => {
    await renderLine({
      attributes: { contextScope: ["disk.io"], groupBy: ["node"], aggregationMethod: "sum" },
      payload: payloadOf({
        dimensions: ["web-01", "web-02", "web-03"].map(id => dimension(id, positive(50))),
        summaryDimensions: ["reads", "writes"],
        nodes: 3,
        instances: 6,
      }),
    })

    expect(line()).toHaveTextContent(
      /^web-01, web-02 and web-03, one line per node, of 6 instances, added up$/
    )
  })

  it("says one line per label key when grouped by a label", async () => {
    await renderLine({
      attributes: { groupBy: ["label"], groupByLabel: ["device_type"] },
      payload: payloadOf({
        dimensions: ["physical", "virtual"].map(id => dimension(id, positive(50))),
        instances: 2,
      }),
    })

    expect(line()).toHaveTextContent(/^physical and virtual, one line per device_type$/)
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

  it("names the first two lines and offers the rest on hover when there are four or more", async () => {
    const { user } = await renderLine({
      payload: payloadOf({
        context: "system.cpu",
        dimensions: cpuDimensions.map(id => dimension(id, positive(20))),
      }),
    })

    expect(line()).toHaveTextContent(/^User, system and 3 more, one line each$/)
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

  it("shows the lock on a chart whose lines are not combined", async () => {
    await renderLine({ attributes: { scopeLock: { label: "sda" } } })

    expect(line()).toHaveTextContent(/^Load1, load5 and load15 on sda, one line each$/)
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
        /^Reads and writes, one line each · writes below zero · device_type: only physical hides virtual · mount_point: only \/ hides \/boot$/
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

    await user.click(screen.getByText("one line each", { exact: false }))

    expect(chart.getAttribute("filtersOpen")).toBe(true)
  })

  it("survives page translation wrapping every text node", async () => {
    const { chart, container } = await renderLine({
      attributes: { scopeLock: { label: "web-03" }, selectedDimensions: ["load1"] },
    })

    simulateTranslate(container)
    act(() => chart.updateAttributes({ selectedDimensions: [], scopeLock: null }))

    await waitFor(() => expect(line()).toHaveTextContent(/one line each$/))
  })
})
