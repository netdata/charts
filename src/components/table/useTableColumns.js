import { useMemo } from "react"
import isEmpty from "lodash/isEmpty"
import difference from "lodash/difference"
import { useChart, useAttributeValue } from "@/components/provider"
import { uppercase } from "@/helpers/objectTransform"
import { labelColumn, valueColumn } from "./columns"

const sortContexts = (contexts, contextScope) =>
  isEmpty(contexts)
    ? contexts
    : isEmpty(difference(contexts, contextScope))
      ? contextScope
      : contexts

export const useTableColumns = (options = {}) => {
  const chart = useChart()
  const contextScope = useAttributeValue("contextScope")
  const { period, dimensionIds, groups, labels, contextGroups } = options

  return useMemo(() => {
    return [
      {
        id: "Instance",
        header: () => chart.intl("groupInstance", { fallback: "Instance" }),
        columns: labels.map(label =>
          labelColumn(chart, {
            header: uppercase(label),
            partIndex: groups.findIndex(gi => gi === label),
          })
        ),
        notFlex: true,
        fullWidth: true,
        enableResizing: true,
      },
      ...sortContexts(Object.keys(contextGroups), contextScope).map(context => {
        return {
          id: `Context-${context}`,
          header: () => chart.intl(context),
          columns: contextGroups[context]
            ? Object.keys(contextGroups[context]).map(dimension =>
                valueColumn(chart, {
                  contextLabel: chart.intl(context),
                  dimensionLabel: chart.intl(dimension),
                  dimensionId: contextGroups[context][dimension]?.[0],
                  keys: [context, dimension],
                  ...options,
                })
              )
            : [],
          labelProps: { textAlign: "center" },
          notFlex: true,
          fullWidth: true,
          enableResizing: true,
        }
      }),
    ]
  }, [chart, contextScope, period, dimensionIds, groups, labels, contextGroups])
}

export default useTableColumns
