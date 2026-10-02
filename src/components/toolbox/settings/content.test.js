import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import { DisplayTab, DataTab, InfoTab, DownloadTab } from "./tabs"
import SettingsContent from "./content"

const CustomBody = () => <div data-testid="customTabBody">Custom</div>
const customTab = { label: "Custom", Component: CustomBody }
const OtherBody = () => <div data-testid="otherTabBody">Other</div>
const otherTab = { label: "Other", Component: OtherBody }

const csvRow = "chartSettings-download-download-as-csv"

describe("SettingsContent", () => {
  it("opens on the first tab by default", () => {
    renderWithChart(<SettingsContent onClose={() => {}} />)

    expect(screen.getByTestId("chartSettings")).toBeInTheDocument()
    expect(screen.queryByTestId(csvRow)).not.toBeInTheDocument()
  })

  it("opens on the requested tab", () => {
    renderWithChart(<SettingsContent onClose={() => {}} initialTab="download" />)

    expect(screen.getByTestId(csvRow)).toBeInTheDocument()
  })

  it("falls back to the first tab for an unknown tab id", () => {
    renderWithChart(<SettingsContent onClose={() => {}} initialTab="missing" />)

    expect(screen.queryByTestId(csvRow)).not.toBeInTheDocument()
  })

  it("opens on the first tab when a custom tab has no id and no tab is requested", () => {
    renderWithChart(<SettingsContent onClose={() => {}} />, {
      attributes: { settingsTabs: [DisplayTab, DataTab, customTab, InfoTab, DownloadTab] },
    })

    expect(screen.queryByTestId("customTabBody")).not.toBeInTheDocument()
    expect(screen.queryByTestId(csvRow)).not.toBeInTheDocument()
  })

  it("opens on the first tab when the first tab has no id", () => {
    renderWithChart(<SettingsContent onClose={() => {}} />, {
      attributes: { settingsTabs: [customTab, DownloadTab] },
    })

    expect(screen.getByTestId("customTabBody")).toBeInTheDocument()
  })

  it("opens a tab without an id by its index", () => {
    renderWithChart(<SettingsContent onClose={() => {}} initialIndex={2} />, {
      attributes: { settingsTabs: [DisplayTab, otherTab, customTab] },
    })

    expect(screen.getByTestId("customTabBody")).toBeInTheDocument()
    expect(screen.queryByTestId("otherTabBody")).not.toBeInTheDocument()
  })

  it("prefers the requested tab id over the index", () => {
    renderWithChart(<SettingsContent onClose={() => {}} initialTab="download" initialIndex={2} />, {
      attributes: { settingsTabs: [DisplayTab, DownloadTab, customTab] },
    })

    expect(screen.getByTestId(csvRow)).toBeInTheDocument()
    expect(screen.queryByTestId("customTabBody")).not.toBeInTheDocument()
  })
})
