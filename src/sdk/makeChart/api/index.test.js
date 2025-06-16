import { fetchChartData, fetchChartWeights } from "./index"

jest.mock("./fetchAgentData", () => jest.fn())
jest.mock("./fetchAgentWeights", () => jest.fn())
jest.mock("./fetchCloudData", () => jest.fn())
jest.mock("./fetchCloudWeights", () => jest.fn())

import fetchAgentData from "./fetchAgentData"
import fetchAgentWeights from "./fetchAgentWeights"
import fetchCloudData from "./fetchCloudData"
import fetchCloudWeights from "./fetchCloudWeights"

describe("API index", () => {
  let mockChart
  let mockOptions

  beforeEach(() => {
    mockChart = {
      getAttributes: jest.fn()
    }
    mockOptions = { signal: {} }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("fetchChartData", () => {
    it("calls fetchAgentData when agent is true", () => {
      mockChart.getAttributes.mockReturnValue({ agent: true })

      fetchChartData(mockChart, mockOptions)

      expect(fetchAgentData).toHaveBeenCalledWith(mockChart, mockOptions)
      expect(fetchCloudData).not.toHaveBeenCalled()
    })

    it("calls fetchCloudData when agent is false", () => {
      mockChart.getAttributes.mockReturnValue({ agent: false })

      fetchChartData(mockChart, mockOptions)

      expect(fetchCloudData).toHaveBeenCalledWith(mockChart, mockOptions)
      expect(fetchAgentData).not.toHaveBeenCalled()
    })

    it("calls fetchCloudData when agent is undefined", () => {
      mockChart.getAttributes.mockReturnValue({})

      fetchChartData(mockChart, mockOptions)

      expect(fetchCloudData).toHaveBeenCalledWith(mockChart, mockOptions)
      expect(fetchAgentData).not.toHaveBeenCalled()
    })
  })

  describe("fetchChartWeights", () => {
    it("calls fetchAgentWeights when agent is true", () => {
      mockChart.getAttributes.mockReturnValue({ agent: true })

      fetchChartWeights(mockChart, mockOptions)

      expect(fetchAgentWeights).toHaveBeenCalledWith(mockChart, mockOptions)
      expect(fetchCloudWeights).not.toHaveBeenCalled()
    })

    it("calls fetchCloudWeights when agent is false", () => {
      mockChart.getAttributes.mockReturnValue({ agent: false })

      fetchChartWeights(mockChart, mockOptions)

      expect(fetchCloudWeights).toHaveBeenCalledWith(mockChart, mockOptions)
      expect(fetchAgentWeights).not.toHaveBeenCalled()
    })

    it("calls fetchCloudWeights when agent is undefined", () => {
      mockChart.getAttributes.mockReturnValue({})

      fetchChartWeights(mockChart, mockOptions)

      expect(fetchCloudWeights).toHaveBeenCalledWith(mockChart, mockOptions)
      expect(fetchAgentWeights).not.toHaveBeenCalled()
    })
  })
})