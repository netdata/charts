import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithProviders } from "@jest/testUtilities"
import Identity from "./identity"

const pairs = [
  ["chip_id", "nvme-pci-0020"],
  ["feature", "temp1"],
]
const rest = [["driver", "nvme"]]

describe("instance identity without a chart", () => {
  it("shows the label pairs, the count of remaining labels and the node", () => {
    renderWithProviders(
      <Identity labelPairs={pairs} labelRest={rest} nodeName="edge-1" name="sensors.temp1@edge-1" />
    )

    expect(screen.getByText("chip_id")).toBeInTheDocument()
    expect(screen.getByText("nvme-pci-0020")).toBeInTheDocument()
    expect(screen.getByText("temp1")).toBeInTheDocument()
    expect(screen.getByText("+1")).toBeInTheDocument()
    expect(screen.getByText("@ edge-1")).toBeInTheDocument()
    expect(screen.queryByText("sensors.temp1@edge-1")).not.toBeInTheDocument()
  })

  it("leaves the node out when the surface already shows it", () => {
    renderWithProviders(<Identity labelPairs={pairs} name="sensors.temp1" />)

    expect(screen.getByText("nvme-pci-0020")).toBeInTheDocument()
    expect(screen.queryByText(/^@/)).not.toBeInTheDocument()
  })

  it("adds the original name when the labels cannot tell instances apart", () => {
    renderWithProviders(<Identity labelPairs={pairs} ambiguous name="sensors.temp1" />)

    expect(screen.getByText("sensors.temp1")).toBeInTheDocument()
  })
})
