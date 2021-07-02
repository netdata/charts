import React from "react"
import context from "./context"

export * from "./selectors"

const ChartProvider = ({ chart, children }) => (
  <context.Provider value={chart}>{children}</context.Provider>
)

export const withChartProvider = Component => {
  const ChartProviderComponent = ({ chart, ...rest }) => (
    <ChartProvider chart={chart}>
      <Component {...rest} />
    </ChartProvider>
  )
  return ChartProviderComponent
}

export default ChartProvider
