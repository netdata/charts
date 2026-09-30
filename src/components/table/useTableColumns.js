import { useMemo } from "react"
import isEmpty from "lodash/isEmpty"
import difference from "lodash/difference"
import { useChart, useAttributeValue, useIsModern } from "@/components/provider"
import { uppercase } from "@/helpers/objectTransform"
import { modernLabelColumn, modernValueColumn } from "@/components/modern/table"
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
  const isModern = useIsModern()
  const { period, dimensionIds, groups, labels, contextGroups } = options

  return useMemo(() => {
    const makeLabelColumn = isModern ? modernLabelColumn : labelColumn
    const makeValueColumn = isModern ? modernValueColumn : valueColumn

    return [
      {
        id: "Instance",
        header: () => chart.intl("groupInstance", { fallback: "Instance" }),
        columns: labels.map((label, index) =>
          makeLabelColumn(chart, {
            header: uppercase(label),
            partIndex: groups.findIndex(gi => gi === label),
            ...(isModern && { withStatus: index === 0 }),
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
          headerString: () => chart.intl(context),
          columns: contextGroups[context]
            ? Object.keys(contextGroups[context]).map(dimension =>
                makeValueColumn(chart, {
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
  }, [chart, contextScope, period, dimensionIds, groups, labels, contextGroups, isModern])
}

export default useTableColumns
