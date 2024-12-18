import React, { useMemo } from "react"
import groupBy from "lodash/groupBy"
import isEmpty from "lodash/isEmpty"
import difference from "lodash/difference"
import { Table } from "@netdata/netdata-ui"
import useHover from "@/components/useHover"
import ChartContainer from "@/components/chartContainer"
import useDebouncedValue from "@netdata/netdata-ui/dist/hooks/useDebouncedValue"
import { useChart, useDimensionIds, useAttributeValue } from "@/components/provider"
import withChart from "@/components/hocs/withChart"
import { ChartWrapper } from "@/components/hocs/withTile"
import { uppercase } from "@/helpers/objectTransform"
import { labelColumn, valueColumn } from "./columns"

const keepoutRegex = ".*"
const keepRegex = "(" + keepoutRegex + ")"

const sortContexts = (contexts, contextScope) =>
  isEmpty(contexts)
    ? contexts // pass empty array to allow the table to rerender when payload comes back with data
    : isEmpty(difference(contexts, contextScope))
      ? contextScope
      : contexts

const useColumns = (chart, options = {}) => {
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
                  context,
                  dimension,
                  dimensionId: contextGroups[context]?.[dimension]?.[0],
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
  }, [period, dimensionIds])
}

const groupByColumn = (result, ids, groups, attrs) => {
  const [attr, ...restAttrs] = attrs
  const groupByRegex = new RegExp(
    groups.reduce((s, g) => {
      s = s + (s ? "," : "")

      if (attr === g) {
        s = s + keepRegex
      } else {
        s = s + keepoutRegex
      }

      return s
    }, "")
  )

  if (isEmpty(result)) {
    result = groupBy(ids, value => {
      const [, ...matches] = value.match(groupByRegex)
      return matches.join(",")
    })
  } else {
    Object.keys(result).forEach(key => {
      result[key] = groupBy(result[key], value => {
        const [, ...matches] = value.match(groupByRegex)
        return matches.join(",")
      })
    })
  }

  if (!restAttrs.length) return result

  return groupByColumn(result, ids, groups, restAttrs)
}

const Dimensions = () => {
  const dimensionIds = useDimensionIds()

  const tab = useAttributeValue("weightsTab")
  const searchQuery = useAttributeValue("searchQuery")

  const chart = useChart()
  const groups = chart.getDimensionGroups()
  const { tableColumns, tableSortBy } = chart.getAttributes()

  const [rowGroups, contextGroups, labels] = useMemo(() => {
    let forRows = []

    let groupByRegex = new RegExp(
      groups.reduce((s, g) => {
        s = s + (s ? "," : "")

        if (tableColumns.includes(g)) {
          s = s + keepoutRegex
        } else {
          s = s + keepRegex
          forRows.push(g)
        }

        return s
      }, "")
    )

    const baseGroup = groupBy(dimensionIds, value => {
      const [, ...matches] = value.match(groupByRegex)
      return matches.join(",")
    })

    let contextAndDimensionsGroup = groupByColumn({}, dimensionIds, groups, tableColumns)

    return [baseGroup, contextAndDimensionsGroup, forRows]
  }, [dimensionIds])

  const columns = useColumns(chart, {
    period: tab,
    groups,
    dimensionIds,
    labels,
    rowGroups,
    contextGroups,
  })

  const sortBy = useMemo(() => {
    if (!tableSortBy || tableSortBy.length > 1 || !contextGroups) return tableSortBy

    const [first] = tableSortBy
    if (!first || !contextGroups[first.id] || !Object.keys(contextGroups[first.id]))
      return tableSortBy

    return Object.keys(contextGroups[first.id]).map(id => ({
      id: `value${first.id}${id}`,
      desc: first.desc,
    }))
  }, [tableSortBy, contextGroups])

  const hoverRef = useHover(
    {
      onHover: chart.focus,
      onBlur: chart.blur,
      isOut: node =>
        !node ||
        (!node.closest(`[data-toolbox="${chart.getId()}"]`) &&
          !node.closest(`[data-chartid="${chart.getId()}"]`)),
    },
    [chart]
  )

  const hover = useAttributeValue("hoverX")
  const data = useMemo(() => {
    return Object.keys(rowGroups).reduce((h, g) => {
      if (!!searchQuery && !new RegExp(searchQuery).test(g)) return h

      h.push({
        key: g,
        ids: searchQuery
          ? rowGroups[g].filter(rg => new RegExp(searchQuery).test(rg))
          : rowGroups[g],
        contextGroups,
      })
      return h
    }, [])
  }, [searchQuery, rowGroups, hover])

  const debouncedData = useDebouncedValue(data, 300)

  return (
    <Table
      ref={hoverRef}
      enableSorting
      enableColumnVisibility
      dataColumns={columns}
      data={debouncedData || data}
      enableCustomSearch
      // onRowSelected={onItemClick}
      // onSearch={noop}
      // meta={meta}
      sortBy={sortBy}
      // rowSelection={rowSelection}
      // onSortingChange={onSortByChange}
      // expanded={expanded}
      // onExpandedChange={onExpandedChange}
      // enableSubRowSelection={enableSubRowSelection}
      width="100%"
      onSearch={q => chart.updateAttribute("searchQuery", q)}
      // bulkActions={bulkActions}
      // rowActions={rowActions}
    />
  )
}

export const TableChart = ({ uiName, ref, ...rest }) => (
  <ChartWrapper ref={ref}>
    <ChartContainer
      uiName={uiName}
      column
      alignItems="center"
      justifyContent="center"
      position="relative"
      {...rest}
    >
      <Dimensions />
    </ChartContainer>
  </ChartWrapper>
)

export default withChart(TableChart)
