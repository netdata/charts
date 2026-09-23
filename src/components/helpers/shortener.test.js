import React from "react"
import { screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import { TextSmall } from "@netdata/netdata-ui"
import { renderWithProviders } from "@jest/testUtilities"
import { shortenToWidth } from "@/helpers/shorten"
import Shortener from "./shortener"

const longText = "a-very-long-node-name-for-shortening"
const shortText = "abc"
const containerWidth = 50

const mockMeasurement = scrollWidth => {
  const offset = jest
    .spyOn(HTMLElement.prototype, "offsetWidth", "get")
    .mockImplementation(() => containerWidth)
  const scroll = jest.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(scrollWidth)

  return () => {
    offset.mockRestore()
    scroll.mockRestore()
  }
}

function widthByTextLength() {
  return (this.textContent || "").length * 7
}

const getTextElement = container => container.querySelector("span")

describe("Shortener", () => {
  let restore

  afterEach(() => restore?.())

  it("settles without an update-depth loop when consecutive measurements disagree", async () => {
    let reads = 0
    restore = mockMeasurement(() => {
      reads += 1
      return reads % 2 ? 400 : 10
    })
    const errors = []
    const consoleError = jest.spyOn(console, "error").mockImplementation((...args) => {
      errors.push(args[0] instanceof Error ? args[0].message : String(args[0]))
    })

    let thrown
    try {
      renderWithProviders(<Shortener Component={TextSmall} text={longText} />)
      await act(() => new Promise(resolve => setTimeout(resolve, 50)))
    } catch (error) {
      thrown = error
    }
    consoleError.mockRestore()

    expect(thrown?.message || "").not.toMatch(/Maximum update depth/)
    expect(errors.filter(message => /Maximum update depth/.test(message))).toHaveLength(0)
    expect(reads).toBe(1)
  })

  it("keeps the same text element when it shortens and un-shortens", async () => {
    restore = mockMeasurement(widthByTextLength)

    const { container, rerender } = renderWithProviders(
      <Shortener Component={TextSmall} text={shortText} />
    )
    const initial = getTextElement(container)

    rerender(<Shortener Component={TextSmall} text={longText} />)
    expect(getTextElement(container)).toBe(initial)
    expect(initial).not.toHaveTextContent(longText)

    rerender(<Shortener Component={TextSmall} text={shortText} />)
    expect(getTextElement(container)).toBe(initial)
    expect(initial).toHaveTextContent(shortText)
  })

  it("shows the shortened text when it overflows", () => {
    restore = mockMeasurement(widthByTextLength)

    const { container } = renderWithProviders(<Shortener Component={TextSmall} text={longText} />)

    expect(getTextElement(container).textContent).toBe(
      shortenToWidth(longText, longText.length * 7, containerWidth)
    )
    expect(getTextElement(container).textContent).not.toBe(longText)
  })

  it("shows the full text in a tooltip on hover when shortened", async () => {
    restore = mockMeasurement(widthByTextLength)
    const user = userEvent.setup()

    const { container } = renderWithProviders(<Shortener Component={TextSmall} text={longText} />)
    await user.hover(getTextElement(container))

    expect(await screen.findByText(longText)).toBeInTheDocument()
  })

  it("shows no tooltip when the text fits", async () => {
    restore = mockMeasurement(widthByTextLength)
    const user = userEvent.setup()

    const { container } = renderWithProviders(<Shortener Component={TextSmall} text={shortText} />)
    await user.hover(getTextElement(container))

    expect(screen.getAllByText(shortText)).toHaveLength(1)
    expect(getTextElement(container)).not.toHaveAttribute("aria-describedby")
  })

  it("shows no tooltip with noTooltip even when shortened", async () => {
    restore = mockMeasurement(widthByTextLength)
    const user = userEvent.setup()

    const { container } = renderWithProviders(
      <Shortener Component={TextSmall} text={longText} noTooltip />
    )
    await user.hover(getTextElement(container))

    expect(screen.queryByText(longText)).not.toBeInTheDocument()
    expect(getTextElement(container)).not.toHaveAttribute("aria-describedby")
  })

  it("passes the text element to a forwarded ref", () => {
    restore = mockMeasurement(widthByTextLength)
    const ref = React.createRef()

    const { container } = renderWithProviders(
      <Shortener Component={TextSmall} text={longText} ref={ref} />
    )

    expect(ref.current).toBe(getTextElement(container))
  })
})
