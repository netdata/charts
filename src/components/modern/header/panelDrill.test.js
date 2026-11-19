import { act, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import Header from "@/components/header"
import { panelDrillPrefix } from "./moreMenu"

const NestedPanel = ({ path, onDrill }) =>
  path.length ? (
    <span data-testid="nested-detail">{path.join("/")}</span>
  ) : (
    ["first", "second"].map(id => (
      <button
        key={id}
        type="button"
        role="menuitem"
        data-menu-id={`${panelDrillPrefix}${id}`}
        data-testid={`nested-${id}`}
        onClick={() => onDrill(id)}
      >
        {id}
      </button>
    ))
  )

const Nested = () => null
Nested.menu = {
  id: "nested",
  group: "root",
  order: 100,
  useItem: ({ path = [] }) => ({
    label: "Nested",
    panelLabel: path.length ? `Nested ${path.at(-1)}` : undefined,
    testId: "consumer-nested",
    Panel: NestedPanel,
  }),
}

const renderNested = async () => {
  const { chart } = makeTestChart({
    attributes: {
      designFlavour: "modern",
      title: "CPU",
      focused: true,
      toolboxElements: [Nested],
    },
  })
  const result = renderWithChart(<Header />, { chart })
  await act(async () => {
    chart.fetch()
  })
  await waitFor(() => expect(chart.getAttribute("loaded")).toBe(true))
  return result
}

const openNested = async user => {
  await user.click(screen.getByTestId("chartHeaderToolbox-more"))
  await user.click(await screen.findByTestId("consumer-nested"))
}

describe("More menu panel sub-levels", () => {
  it("lets a panel drill into a sub-level with a single back row", async () => {
    const { user, chart } = await renderNested()
    await openNested(user)

    await user.click(screen.getByTestId("nested-second"))

    expect(chart.getAttribute("moreMenu")).toEqual({
      drill: ["nested", `${panelDrillPrefix}second`],
    })
    expect(screen.getByTestId("nested-detail")).toHaveTextContent("second")
    expect(screen.getAllByTestId("chartMore-back")).toHaveLength(1)
    expect(screen.getByTestId("chartMore-back")).toHaveTextContent("← Nested second")
  })

  it("goes back to the panel root and focuses the row it came from", async () => {
    const { user } = await renderNested()
    await openNested(user)
    await user.click(screen.getByTestId("nested-second"))

    await user.click(screen.getByTestId("chartMore-back"))

    expect(screen.getByTestId("chartMore-back")).toHaveTextContent("← Nested")
    expect(screen.getByTestId("nested-second")).toHaveFocus()
  })

  it("opens straight on a sub-level from the drill stack", async () => {
    const { user, chart } = await renderNested()
    await user.click(screen.getByTestId("chartHeaderToolbox-more"))

    act(() => chart.updateAttribute("moreMenu", { drill: ["nested", `${panelDrillPrefix}first`] }))

    expect(await screen.findByTestId("nested-detail")).toHaveTextContent("first")
  })
})
