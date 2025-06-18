import makeDefaultSDK from "@/makeDefaultSDK"
import makeMockPayload from "@/helpers/makeMockPayload"
import systemLoadLine from "../../fixtures/systemLoadLine"

export const makeTestChart = (options = {}) => {
  const { attributes = {}, mockData = systemLoadLine[0], ...sdkOptions } = options
  
  const sdk = makeDefaultSDK({
    attributes: {
      contextScope: ["system.cpu"],
      ...attributes
    },
    ...sdkOptions
  })
  
  const chart = sdk.makeChart({ 
    getChart: makeMockPayload(mockData, { delay: 0 })
  })
  
  sdk.appendChild(chart)
  
  return { sdk, chart }
}