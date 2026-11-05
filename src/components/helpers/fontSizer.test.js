import React from "react"
import { act, render } from "@testing-library/react"
import FontSizer, { findFittedFontSize } from "./fontSizer"

const TestText = ({ truncate, ref, ...rest }) => (
  <div data-truncate={truncate} ref={ref} {...rest} />
)

describe("findFittedFontSize", () => {
  it("finds every fitting threshold with at most seven probes", () => {
    for (let threshold = 10; threshold <= 50; threshold += 1) {
      let probes = 0
      const fontSize = findFittedFontSize({
        minFontSize: 10,
        maxFontSize: 50,
        fits: candidate => {
          probes += 1
          return candidate <= threshold
        },
      })

      expect(fontSize).toBe(threshold)
      expect(probes).toBeLessThanOrEqual(7)
    }
  })

  it("keeps the minimum size when no candidate fits", () => {
    const fontSize = findFittedFontSize({
      minFontSize: 10,
      maxFontSize: 50,
      fits: () => false,
    })

    expect(fontSize).toBe(10)
  })
})

describe("FontSizer", () => {
  beforeEach(() => jest.useFakeTimers())

  afterEach(() => jest.useRealTimers())

  it("applies the largest fitting font size", () => {
    const { getByText } = render(
      <FontSizer
        Component={TestText}
        maxFontSize={50}
        minFontSize={10}
        maxWidth={235}
        maxHeight={100}
      >
        value
      </FontSizer>
    )
    const element = getByText("value")
    let widthReads = 0

    Object.defineProperties(element, {
      offsetHeight: {
        configurable: true,
        get: () => Number.parseFloat(element.style.fontSize),
      },
      offsetWidth: {
        configurable: true,
        get: () => {
          widthReads += 1
          return Number.parseFloat(element.style.fontSize) * 10
        },
      },
    })

    act(() => jest.runOnlyPendingTimers())

    expect(element.style.fontSize).toBe("23px")
    expect(widthReads).toBeLessThanOrEqual(7)
  })
})
