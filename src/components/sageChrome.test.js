import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { DefaultTheme, DarkTheme } from "@netdata/netdata-ui/dist/theme"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import { Container } from "./line/chartContentWrapper"
import ZoomChip from "./modern/header/zoomChip"
import Meter from "./modern/table/meter"
import ColorPicker from "./line/overlays/annotation/colorPicker"
import AnomalyPill from "./modern/header/anomalyPill"
import MoreMenu from "./modern/header/moreMenu"
import { DeltaPill } from "./modern/table/columns"
import { makePayload } from "../../fixtures/makeWavePayload"

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    mainChartBg: "#aaaaaa",
    text: "#555555",
    buttonNeutralFill: "#123456",
    buttonNeutralText: "#fedcba",
    progressBg: "#345678",
    controlFocused: "#56789a",
    controlPressedBackground: "#789abc",
    segmentedBorder: "#89abcd",
  },
}

it("uses chart axis ink instead of a separate Dygraph neutral palette", () => {
  const { chart } = renderWithChart(
    <Container>
      <div className="default">
        <span className="dygraph-axis-label">Axis</span>
      </div>
    </Container>,
    {
      attributes: { chartLibrary: "dygraph", themeAxisLabelColor: ["#123456", "#abcdef"] },
    }
  )
  expect(screen.getByText("Axis")).toHaveStyle({ color: "#123456" })
  act(() => chart.updateAttribute("theme", "dark"))
  expect(screen.getByText("Axis")).toHaveStyle({ color: "#abcdef" })
})

it("uses the SDK selection neutral for the uPlot drag region", () => {
  renderWithChart(
    <Container>
      <div className="u-select" data-testid="selection" />
    </Container>,
    {
      attributes: { chartLibrary: "uplot", themeSelectionColor: ["#123456", "#abcdef"] },
    }
  )
  expect(screen.getByTestId("selection")).toHaveStyle({ background: "rgba(18, 52, 86, 0.3)" })
})

it("keeps zoom button ink and fill independent of chart surfaces and content", () => {
  const { chart } = makeTestChart()
  renderWithChart(<ZoomChip />, { chart, theme })
  const now = Math.floor(Date.now() / 1000)
  act(() => chart.updateAttributes({ after: now - 600, before: now - 300 }))
  expect(screen.getByTestId("chartZoomChip-reset")).toHaveStyle({
    background: "#123456",
    color: "#fedcba",
  })
})

it("uses the progress track role instead of a thin border role", () => {
  renderWithChart(<Meter value={30} color="#0075f2" />, { theme })
  expect(screen.getByRole("meter")).toHaveStyle({ background: "#345678" })
})

it("shows the selected annotation swatch with the control focus border", () => {
  const { container } = renderWithChart(<ColorPicker selectedColor="#0075F2" />, { theme })
  const swatch = [...container.querySelectorAll("div")].find(
    node => getComputedStyle(node).backgroundColor === "rgb(0, 117, 242)"
  )
  expect(swatch).toHaveStyle({ borderColor: "#56789a" })
})

it.each([
  ["default", 12.5, DefaultTheme, "onColorDark", "rgb(156, 127, 235)"],
  ["default", 50, DefaultTheme, "onColorLight", "rgb(98, 52, 214)"],
  ["dark", 0.5, DarkTheme, "onColorLight", "rgb(86, 68, 152)"],
  ["dark", 50, DarkTheme, "onColorDark", "rgb(196, 160, 255)"],
])(
  "keeps %s anomaly ink readable at %s%% without changing the data fill",
  async (mode, rate, theme, ink, fill) => {
    const { chart } = makeTestChart({ attributes: { theme: mode, designFlavour: "modern" } })
    chart.doneFetch(
      makePayload({
        context: "anomaly.cpu",
        title: "CPU",
        unit: "percentage",
        dimensions: [
          {
            id: "user",
            values: Array(97).fill(50),
            anomalyRates: Array(97).fill(rate),
          },
        ],
      })
    )
    await act(() => new Promise(resolve => setTimeout(resolve, 0)))
    renderWithChart(<AnomalyPill />, { chart, theme })
    expect(screen.getByTestId("chartAnomalyPill")).toHaveStyle({
      color: theme.colors[ink],
      background: fill,
    })
  }
)

it("uses the pressed control surface and dedicated selected edge for navigation modes", () => {
  renderWithChart(<MoreMenu />, { theme, attributes: { navigation: "pan" } })
  expect(screen.getByRole("button", { name: "Pan" })).toHaveStyle({
    background: "#789abc",
    borderColor: "#89abcd",
    color: "#555555",
  })
})

it("keeps a delta badge surface independent of its content ink", () => {
  renderWithChart(<DeltaPill>+4%</DeltaPill>, { theme })
  expect(screen.getByText("+4%").parentElement).toHaveStyle({ background: "#789abc" })
})
