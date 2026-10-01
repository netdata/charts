import React, { useMemo } from "react"
import isEmpty from "lodash/isEmpty"
import difference from "lodash/difference"
import { useChart, useAttributeValue, useIsModern } from "@/components/provider"
import { uppercase } from "@/helpers/objectTransform"
import { modernLabelColumn, modernValueColumn, ModernGroupHeader } from "@/components/modern/table"
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

    const labelOptions = labels.map(label => ({
      header: uppercase(label),
      partIndex: groups.findIndex(gi => gi === label),
    }))

    const labelColumns = labelOptions.map((labelOption, index) =>
      makeLabelColumn(chart, {
        ...labelOption,
        ...(isModern && { withStatus: index === 0 }),
      })
    )

    if (isModern && labelColumns.length > 1)
      labelColumns[0] = makeLabelColumn(chart, {
        ...labelOptions[0],
        withStatus: true,
        mergedLabels: labelColumns.slice(1).map((column, index) => ({
          id: column.id,
          name: column.name,
          partIndex: labelOptions[index + 1].partIndex,
        })),
      })

    return [
      {
        id: "Instance",
        header: () => chart.intl("groupInstance", { fallback: "Instance" }),
        columns: labelColumns,
        notFlex: true,
        fullWidth: true,
        enableResizing: true,
      },
      ...sortContexts(Object.keys(contextGroups), contextScope).map(context => {
        return {
          id: `Context-${context}`,
          header: isModern
            ? ({ table }) => <ModernGroupHeader table={table} context={context} />
            : () => chart.intl(context),
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
