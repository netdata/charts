import React, { useCallback, useLayoutEffect, useMemo, useRef } from "react"
import { Button, Flex, Table } from "@netdata/netdata-ui"
import { useAttribute } from "@/components/provider"
import { matchesSearch, normalizeSearch } from "@/components/drawer/search"
import { nameColumn, correlationColumn, changeColumn, sparklineColumn } from "./columns"

const noop = () => {}
const cannotExpand = () => false

const getRowId = row => row.rowId
const getRowCanExpand = row => row.original.kind === "context"

const CorrelationTable = ({ data }) => {
  const tableRef = useRef(null)
  const containerRef = useRef(null)
  const restoreSearchFocusRef = useRef(false)
  const [expanded = {}, setExpanded] = useAttribute("correlate.expanded")
  const [search = "", setSearch] = useAttribute("correlate.search")
  const columns = useMemo(
    () => [nameColumn(), correlationColumn(), changeColumn(), sparklineColumn()],
    []
  )
  const searching = Boolean(normalizeSearch(search))
  const searchableData = useMemo(
    () =>
      data.flatMap(context => [
        { ...context, children: undefined, searchDepth: 0 },
        ...(context.children || []).map(dimension => ({
          ...dimension,
          children: undefined,
          searchDepth: 1,
          searchSiblings: context.children,
        })),
      ]),
    [data]
  )
  const displayData = useMemo(
    () =>
      searching
        ? searchableData.filter(row =>
            matchesSearch(
              row.kind === "context"
                ? [row.contextName]
                : [row.dimensionName, row.nodeName, row.context],
              search
            )
          )
        : data,
    [data, search, searchableData, searching]
  )
  const dimensionCount = useMemo(
    () =>
      displayData.reduce(
        (count, row) =>
          count +
          (row.kind === "dimension" ? 1 : row.children?.length || row.count || 0),
        0
      ),
    [displayData]
  )
  const contextCount = useMemo(
    () => new Set(displayData.map(row => row.context)).size,
    [displayData]
  )
  const allExpanded =
    searching || expanded === true || data.every(context => Boolean(expanded?.[context.rowId]))
  const getItemKey = useCallback(
    index =>
      tableRef.current?.getRowModel().rows[index]?.id || displayData[index]?.rowId || index,
    [displayData]
  )
  const virtualizeOptions = useMemo(() => ({ overscan: 1, getItemKey }), [getItemKey])

  const onSearch = useCallback(
    query => {
      restoreSearchFocusRef.current =
        containerRef.current?.querySelector('[data-testid="table-global-search-filter"]') ===
        document.activeElement
      setSearch(query)
    },
    [setSearch]
  )

  useLayoutEffect(() => {
    if (!restoreSearchFocusRef.current) return

    const input = containerRef.current?.querySelector(
      '[data-testid="table-global-search-filter"]'
    )
    input?.focus()
    input?.setSelectionRange(input.value.length, input.value.length)
    restoreSearchFocusRef.current = false
  }, [searching])

  return (
    <Flex
      flex
      column
      height={{ min: "0px", base: "100%" }}
      overflow="hidden"
      ref={containerRef}
    >
      <Table
        key={searching ? "search" : "browse"}
        title={`Found ${dimensionCount} correlated dimensions across ${contextCount} contexts`}
        headerChildren={
          <Button
            neutral
            disabled={searching}
            label={allExpanded ? "Collapse all" : "Expand all"}
            onClick={() => setExpanded(allExpanded ? {} : true)}
          />
        }
        enableCustomSearch
        dataColumns={columns}
        data={displayData}
        expanded={searching ? {} : expanded}
        onExpandedChange={searching ? noop : setExpanded}
        globalFilter={search}
        onSearch={onSearch}
        getRowId={getRowId}
        getRowCanExpand={searching ? cannotExpand : getRowCanExpand}
        virtualizeOptions={virtualizeOptions}
        tableRef={tableRef}
        width="100%"
      />
    </Flex>
  )
}

export default CorrelationTable
