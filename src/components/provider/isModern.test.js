import React from "react"
import { renderHook } from "@testing-library/react"
import { makeTestChart } from "@jest/testUtilities"
import ChartProvider, { useIsMinimal, useIsModern } from "./index"

const renderFlavour = designFlavour => {
  const { chart } = makeTestChart({ attributes: { designFlavour } })
  const wrapper = ({ children }) => <ChartProvider chart={chart}>{children}</ChartProvider>
  return renderHook(() => ({ modern: useIsModern(), minimal: useIsMinimal() }), { wrapper }).result
    .current
}

describe("design flavour selectors", () => {
  it("is modern only for the modern flavour", () => {
    expect(renderFlavour("modern")).toEqual({ modern: true, minimal: false })
    expect(renderFlavour("default")).toEqual({ modern: false, minimal: false })
    expect(renderFlavour("minimal")).toEqual({ modern: false, minimal: true })
  })
})
