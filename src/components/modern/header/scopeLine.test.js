import { act, screen, waitFor, within } from "@testing-library/react"
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
  groupedBy,
}) => {
  const payload = makePayload({ context, title: context, unit: "KiB/s", dimensions })

  return {
    ...payload,
    view: {
      ...payload.view,
      dimensions: {
        ...payload.view.dimensions,
        ...(aggregated && { aggregated }),
        ...(groupedBy && { grouped_by: groupedBy }),
      },
    },
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
        dimensions: summaryDimensions.map((id, pri) => ({
          id,
          pri,
          sts: { min: 0, max: 1, avg: 1, con: 0 },
        })),
      }),
      labels,
    },
    totals: { nodes: { sl: nodes, qr: nodes }, instances: { sl: instances, qr: instances } },
  }
}

const readsAndWrites = [dimension("reads", positive(80)), dimension("writes", negative(40))]

const cpuDimensions = ["user", "system", "nice", "iowait", "irq"]

const groupedSeries = (dimensionIds, members, valuesOf = () => positive(50)) =>
  dimensionIds.flatMap(dimensionId =>
    members.map(({ id, name }) => ({
      id: `${dimensionId},${id}`,
      name: `${dimensionId},${name}`,
      values: valuesOf(dimensionId, id),
    }))
  )

const nodeMembers = names => names.map((name, index) => ({ id: `node-${index}`, name }))

const sameMembers = names => names.map(name => ({ id: name, name }))

const writesBelowZero = dimensionId => (dimensionId === "writes" ? negative(40) : positive(80))

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
        groupedBy: ["node"],
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
        groupedBy: ["node"],
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
        nodesById: { "node-0": { name: "db primary" } },
      },
      payload: payloadOf({
        dimensions: groupedSeries(["reads", "writes"], nodeMembers(["web-01", "web-02"])),
        summaryDimensions: ["reads", "writes"],
        nodes: 2,
        instances: 8,
        instancesPerNode: [4, 4],
        aggregated: [4, 4, 4, 4],
        groupedBy: ["dimension", "node"],
      }),
    })

    expect(line()).toHaveTextContent(
      /^Reads and writes per node \(2\): db primary, web-02 · each adds up 4 instances$/
    )
  })

  it("names the grouping the server applied after a post group by node", async () => {
    await renderLine({
      attributes: {
        contextScope: ["disk.io"],
        groupBy: ["label"],
        groupByLabel: ["device"],
        showPostAggregations: true,
        postGroupBy: ["node"],
        aggregationMethod: "sum",
      },
      payload: payloadOf({
        dimensions: ["host1", "host2"].map(id => dimension(id, positive(50))),
        summaryDimensions: ["reads", "writes"],
        nodes: 2,
        instances: 4,
        instancesPerNode: [2, 2],
        groupedBy: ["node"],
      }),
    })

    expect(line()).toHaveTextContent(/^Per node: host1, host2 · each adds up 2 instances$/)
  })

  describe("when grouped by dimension and other keys", () => {
    const nodeNames = Array.from({ length: 24 }, (_, index) => `ip-10-200-${index}-1.ec2.internal`)

    const renderPerNode = valuesOf =>
      renderLine({
        attributes: { groupBy: ["dimension", "node"], aggregationMethod: "sum" },
        payload: payloadOf({
          dimensions: groupedSeries(["writes", "reads"], nodeMembers(nodeNames), valuesOf),
          summaryDimensions: ["reads", "writes"],
          nodes: 24,
          instances: 24,
          instancesPerNode: nodeNames.map(() => 1),
          groupedBy: ["dimension", "node"],
        }),
      })

    it("makes the dimensions the subject and names each node once", async () => {
      await renderPerNode(writesBelowZero)

      expect(line()).toHaveTextContent(
        /^Reads and writes per node \(24\): ip-10-200-0-1\.ec2\.internal, ip-10-200-1-1\.ec2\.internal and 22 more · writes below zero$/
      )
    })

    it("offers the whole sentence with every node on hover", async () => {
      const { user } = await renderPerNode(writesBelowZero)

      await user.hover(screen.getByTestId("chartScope"))

      expect(
        await screen.findByText(
          `Reads and writes per node (24): ${nodeNames.join(", ")} · writes below zero`
        )
      ).toBeInTheDocument()
    })

    it("does not call a dimension below zero when one of its series is not", async () => {
      await renderPerNode((dimensionId, nodeId) =>
        dimensionId === "writes" && nodeId !== "node-3" ? negative(40) : positive(80)
      )

      expect(line()).not.toHaveTextContent(/below zero/)
    })

    it("keeps the line on one row and lets only the node list give way", async () => {
      await renderPerNode(writesBelowZero)

      expect(getComputedStyle(line()).flexWrap).not.toBe("wrap")
      expect(getComputedStyle(screen.getByTestId("chartScope-members"))).toMatchObject({
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      })
      expect(getComputedStyle(screen.getByTestId("chartScope")).minWidth).toBe("0px")
      expect(getComputedStyle(screen.getByTestId("chartScope-heading")).overflow).not.toBe("hidden")
      expect(getComputedStyle(screen.getByTestId("chartScope-belowZero")).textOverflow).toBe(
        "ellipsis"
      )
      expect(Number(getComputedStyle(screen.getByTestId("chartScope")).flexShrink)).toBeGreaterThan(
        Number(getComputedStyle(screen.getByTestId("chartScope-belowZero")).flexShrink)
      )
    })

    it("keeps the spaces around each separator", async () => {
      await renderPerNode(writesBelowZero)

      const separator = within(line()).getByText("·")
      expect(separator.textContent).toBe(" · ")
      expect(getComputedStyle(separator).whiteSpace).toBe("pre-wrap")
    })

    it("names the label values once when grouped by dimension and a label", async () => {
      await renderLine({
        attributes: { groupBy: ["dimension", "label"], groupByLabel: ["device"] },
        payload: payloadOf({
          dimensions: groupedSeries(
            ["reads", "writes"],
            sameMembers(["sda", "sdb", "sdc", "sdd", "sde", "sdf"])
          ),
          summaryDimensions: ["reads", "writes"],
          instances: 6,
          groupedBy: ["dimension", "label:device"],
        }),
      })

      expect(line()).toHaveTextContent(/^Reads and writes per device \(6\): sda, sdb and 4 more$/)
    })

    it("names the consumer's singular noun when grouped by dimension and instance", async () => {
      await renderLine({
        attributes: {
          groupBy: ["dimension", "instance"],
          scopeCombines: { noun: "disks", nounSingular: "disk" },
        },
        payload: payloadOf({
          dimensions: groupedSeries(
            ["reads", "writes"],
            [
              { id: "sda@node-0", name: "sda@web-01" },
              { id: "sdb@node-0", name: "sdb@web-01" },
            ],
            writesBelowZero
          ),
          summaryDimensions: ["reads", "writes"],
          instances: 2,
          groupedBy: ["dimension", "instance"],
        }),
      })

      expect(line()).toHaveTextContent(
        /^Reads and writes per disk \(2\): sda@web-01, sdb@web-01 · writes below zero$/
      )
    })
  })

  describe("when grouped by several keys without the dimension", () => {
    it("counts each key and names the nodes once when grouped by node and a label", async () => {
      await renderLine({
        attributes: { groupBy: ["node", "label"], groupByLabel: ["device_type"] },
        payload: payloadOf({
          dimensions: ["physical", "virtual"].flatMap(type =>
            ["web-01", "web-02"].map((name, index) => ({
              id: `node-${index},${type}`,
              name: `${name},${type}`,
              values: negative(40),
            }))
          ),
          summaryDimensions: ["reads", "writes"],
          nodes: 2,
          instances: 4,
          groupedBy: ["node", "label:device_type"],
        }),
      })

      expect(line()).toHaveTextContent(/^Per node and device_type \(2 × 2\): web-01, web-02$/)
    })

    it("counts each key and names the first key's values once when grouped by two labels", async () => {
      await renderLine({
        attributes: { groupBy: ["label"], groupByLabel: ["device", "device_type"] },
        payload: payloadOf({
          dimensions: [
            ["sda", "physical"],
            ["sdb", "physical"],
            ["sdc", "virtual"],
            ["sdd", "virtual"],
            ["sda", "virtual"],
          ].map(([device, type]) => dimension(`${device},${type}`, positive(50))),
          summaryDimensions: ["reads", "writes"],
          instances: 5,
          groupedBy: ["label:device", "label:device_type"],
        }),
      })

      expect(line()).toHaveTextContent(
        /^Per device and device_type \(4 × 2\): sda, sdb and 2 more$/
      )
    })
  })

  it("counts the instances behind each series even when they match the series count", async () => {
    await renderLine({
      attributes: {
        contextScope: ["disk.io"],
        groupBy: ["dimension", "label"],
        groupByLabel: ["device_type"],
        aggregationMethod: "sum",
      },
      payload: payloadOf({
        dimensions: ["reads,physical", "reads,virtual", "writes,physical", "writes,virtual"].map(
          id => dimension(id, positive(50))
        ),
        summaryDimensions: ["reads", "writes"],
        instances: 4,
        aggregated: [2, 2, 2, 2],
        groupedBy: ["dimension", "label:device_type"],
      }),
    })

    expect(line()).toHaveTextContent(
      /^Reads and writes per device_type \(2\): physical, virtual · each adds up 2 instances$/
    )
  })

  it("does not count metrics as instances when a label groups several dimensions", async () => {
    await renderLine({
      attributes: { groupBy: ["label"], groupByLabel: ["device_type"], aggregationMethod: "sum" },
      payload: payloadOf({
        dimensions: ["physical", "virtual"].map(id => dimension(id, positive(50))),
        summaryDimensions: ["reads", "writes"],
        instances: 4,
        aggregated: [4, 4],
        groupedBy: ["label:device_type"],
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
        groupedBy: ["node"],
      }),
    })

    expect(line()).toHaveTextContent(/^Per node: web-01, web-02, web-03 · each averages 2 disks$/)
  })

  it("names the first two values of a label and offers them all on hover", async () => {
    const { user } = await renderLine({
      attributes: { groupBy: ["label"], groupByLabel: ["device"] },
      payload: payloadOf({
        dimensions: ["sda", "sdb", "sdc", "sdd", "sde"].map(id => dimension(id, positive(50))),
        instances: 5,
        groupedBy: ["label:device"],
      }),
    })

    expect(line()).toHaveTextContent(/^Per device: sda, sdb and 3 more$/)
    await user.hover(screen.getByTestId("chartScope"))
    expect(await screen.findByText("Per device: sda, sdb, sdc, sdd, sde")).toBeInTheDocument()
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
        groupedBy: ["instance"],
      }),
    })

    expect(line()).toHaveTextContent(/^Per disk: sda, sdb and 3 more$/)
    await user.hover(screen.getByTestId("chartScope"))
    expect(await screen.findByText("Per disk: sda, sdb, sdc, sdd, sde")).toBeInTheDocument()
  })

  it("falls back to instance when grouped by instance without a noun", async () => {
    await renderLine({
      attributes: { groupBy: ["instance"] },
      payload: payloadOf({
        dimensions: ["sda", "sdb"].map(id => dimension(id, positive(50))),
        instances: 2,
        groupedBy: ["instance"],
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
        groupedBy: ["label:device_type"],
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

  it("names the first two dimensions and offers them all on hover when there are four or more", async () => {
    const { user } = await renderLine({
      payload: payloadOf({
        context: "system.cpu",
        dimensions: cpuDimensions.map(id => dimension(id, positive(20))),
      }),
    })

    expect(line()).toHaveTextContent(/^User, system and 3 more$/)
    await user.hover(screen.getByTestId("chartScope"))
    expect(await screen.findByText("User, system, nice, iowait and irq")).toBeInTheDocument()
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
