import React from "react"
import Context from "./context"

export * from "./selectors"

const ChartProvider = ({ chart, children }) => (
  <Context.Provider value={chart}>{children}</Context.Provider>
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
