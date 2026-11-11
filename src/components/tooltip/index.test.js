import { screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { DefaultTheme } from "@netdata/netdata-ui"
import { renderWithChart, inkOf, bubblesAround } from "@jest/testUtilities"
import Tooltip, { withTooltip } from "./index"

const { tooltip, tooltipText } = DefaultTheme.colors

describe("Tooltip component", () => {
  it("renders tooltip when content is provided", () => {
    renderWithChart(
      <Tooltip content="Tooltip content" data-testid="tooltip-trigger">
        <button>Hover me</button>
      </Tooltip>
    )

    expect(screen.getByText("Hover me")).toBeInTheDocument()
  })

  it("renders children directly when no content", () => {
    renderWithChart(
      <Tooltip>
        <button>No tooltip button</button>
      </Tooltip>
    )

    expect(screen.getByText("No tooltip button")).toBeInTheDocument()
  })

  it("shows tooltip content on hover", async () => {
    const { user } = renderWithChart(
      <Tooltip content="This is the tooltip content">
        <button>Hover for tooltip</button>
      </Tooltip>
    )

    const button = screen.getByText("Hover for tooltip")

    // Hover over the button
    await user.hover(button)

    // Tooltip content should appear
    expect(await screen.findByText("This is the tooltip content")).toBeInTheDocument()

    // Unhover
    await user.unhover(button)

    // Tooltip should disappear
    await waitFor(() => {
      expect(screen.queryByText("This is the tooltip content")).not.toBeInTheDocument()
    })
  })

  it("passes dropProps with data-toolbox", () => {
    renderWithChart(
      <Tooltip content="Test" data-toolbox="test-id">
        <button>Button</button>
      </Tooltip>
    )

    expect(screen.getByText("Button")).toBeInTheDocument()
  })

  it("draws a string in the kit tooltip bubble with the tooltip ink", async () => {
    const { user } = renderWithChart(
      <Tooltip content="Styled tooltip">
        <button>Hover me</button>
      </Tooltip>
    )

    await user.hover(screen.getByText("Hover me"))

    const text = await screen.findByText("Styled tooltip")
    const bubbles = bubblesAround(text, tooltip)
    expect(bubbles).toHaveLength(1)
    expect(getComputedStyle(bubbles[0]).borderRadius).toBe("6px")
    expect(inkOf(text)).toBe(tooltipText.toUpperCase())
  })

  it("formats a { title, description } object through the kit bubble", async () => {
    const { user } = renderWithChart(
      <Tooltip content={{ title: "Heading", description: "Details" }}>
        <button>Hover me</button>
      </Tooltip>
    )

    await user.hover(screen.getByText("Hover me"))

    const title = await screen.findByText("Heading")
    const description = await screen.findByText("Details")
    expect(bubblesAround(title, tooltip)).toHaveLength(1)
    expect(inkOf(title)).toBe(tooltipText.toUpperCase())
    expect(inkOf(description)).toBe(tooltipText.toUpperCase())
  })

  it("respects disabled prop", async () => {
    const { user } = renderWithChart(
      <Tooltip content="Should not show" disabled>
        <button>Disabled tooltip</button>
      </Tooltip>
    )

    await user.hover(screen.getByText("Disabled tooltip"))

    // Tooltip should not appear when disabled
    expect(screen.queryByText("Should not show")).not.toBeInTheDocument()
  })

  it("keeps the same child DOM node when content toggles empty/non-empty", () => {
    const { rerender } = renderWithChart(
      <Tooltip content="">
        <button data-testid="target">Target</button>
      </Tooltip>
    )
    const initial = screen.getByTestId("target")

    rerender(
      <Tooltip content="Now with content">
        <button data-testid="target">Target</button>
      </Tooltip>
    )
    expect(screen.getByTestId("target")).toBe(initial)

    rerender(
      <Tooltip content="">
        <button data-testid="target">Target</button>
      </Tooltip>
    )
    expect(screen.getByTestId("target")).toBe(initial)
  })

  it("shows no tooltip on hover when content is empty", async () => {
    const { user } = renderWithChart(
      <Tooltip content="">
        <button>Hover target</button>
      </Tooltip>
    )

    await user.hover(screen.getByText("Hover target"))

    expect(screen.getByText("Hover target")).not.toHaveAttribute("aria-describedby")
  })
})

describe("withTooltip HOC", () => {
  it("wraps component and adds tooltip functionality", () => {
    const TestComponent = ({ children, ...props }) => (
      <button data-testid="test-button" {...props}>
        {children}
      </button>
    )

    const WrappedComponent = withTooltip(TestComponent)

    renderWithChart(<WrappedComponent title="Test tooltip">Button with tooltip</WrappedComponent>)

    expect(screen.getByTestId("test-button")).toBeInTheDocument()
    expect(screen.getByText("Button with tooltip")).toBeInTheDocument()
  })

  it("passes through all props to wrapped component", () => {
    const TestComponent = ({ customProp, ...props }) => (
      <div data-testid="test-component" data-custom={customProp} {...props} />
    )

    const WrappedComponent = withTooltip(TestComponent)

    renderWithChart(
      <WrappedComponent customProp="custom-value" className="test-class">
        Content
      </WrappedComponent>
    )

    const element = screen.getByTestId("test-component")
    expect(element).toHaveAttribute("data-custom", "custom-value")
    expect(element).toHaveClass("test-class")
  })

  it("handles components without title prop", () => {
    const TestComponent = props => <div data-testid="no-title" {...props} />
    const WrappedComponent = withTooltip(TestComponent)

    renderWithChart(<WrappedComponent>No tooltip</WrappedComponent>)

    expect(screen.getByTestId("no-title")).toBeInTheDocument()
  })

  it("shows the title as tooltip content on hover", async () => {
    const TestComponent = props => <button {...props}>Target</button>
    const WrappedComponent = withTooltip(TestComponent)

    const { user } = renderWithChart(<WrappedComponent title="Wrapped title" />)
    await user.hover(screen.getByText("Target"))

    expect(await screen.findByText("Wrapped title")).toBeInTheDocument()
  })

  it("shows no tooltip on hover when title is absent", async () => {
    const TestComponent = props => <button {...props}>Target</button>
    const WrappedComponent = withTooltip(TestComponent)

    const { user } = renderWithChart(<WrappedComponent />)
    await user.hover(screen.getByText("Target"))

    expect(screen.getByText("Target")).not.toHaveAttribute("aria-describedby")
  })
})
