import React, { useCallback, useMemo } from "react"
import difference from "lodash/difference"
import { useAttributeValue, useChart } from "@/components/provider"
import useUpdateEffect from "@netdata/netdata-ui/dist/hooks/useUpdateEffect"
import { CheckboxesContainer, checkboxesDefaultProps } from "./checkboxes"
import FilterGroup from "../filterGroup"

const nodeLabelsLowPriority = ["_aclk_available", "_aclk_ng_new_cloud_protocol", "_aclk_proxy"]

const useOptions = (nodesById = {}) => {
  const nodes = useAttributeValue("nodes")
  const selected = useAttributeValue("selectedNodeLabelsFilter")

  return useMemo(() => {
    return Object.entries(
      Object.keys(nodes).reduce((h, id) => {
        const labels = nodesById[id]?.labels

        if (!labels) return h

        Object.keys(labels).forEach(label => {
          h[label] = h[label] || { count: 0, children: {} }
          h[label].count = (h[label].count || 0) + 1

          h[label].children[labels[label]] = (h[label].children[labels[label]] || 0) + 1
        })
        return h
      }, {})
    )
      .reduce((h, [id, { count, children }]) => {
        h.push({
          id,
          count,
          children: Object.entries(children).map(([childId, childCount]) => ({
            value: `${id}|${childId}`,
            label: childId,
            count: childCount,
            level: 1,
          })),
        })

        return h
      }, [])
      .sort((a, b) => {
        if (nodeLabelsLowPriority.includes(a.id)) return 1
        if (nodeLabelsLowPriority.includes(b.id)) return -1
        return a.id.localeCompare(b.id, undefined, {
          sensitivity: "accent",
          ignorePunctuation: true,
        })
      })
  }, [nodesById, selected])
}

const buildItems = ({ options, selected, itemsProps = {} }) => {
  if (!options.length) return []

  const allValues = options.flatMap(option => option.children.map(o => o.value))
  const allSelected = allValues.length === selected.length
  const someSelected = !allSelected && !!selected.length

  return [
    {
      ...itemsProps.head,
      label: "Select all",
      value: allValues,
      selected: allSelected,
      indeterminate: someSelected,
    },
    ...options.flatMap(({ id, children, count }) => {
      const allTypeSelected =
        selected.length && !children.some(child => !selected.includes(child.value))
      const someTypeSelected =
        !allTypeSelected &&
        selected.length &&
        children.some(child => selected.includes(child.value))

      return children.reduce(
        (acc, child) => {
          const isSelected = selected.includes(child.value)

          return [
            ...acc,
            {
              ...itemsProps.row,
              ...child,
              selected: isSelected,
            },
          ]
        },
        [
          {
            ...itemsProps.head,
            label: id,
            value: children.map(c => c.value),
            selected: allTypeSelected,
            indeterminate: someTypeSelected,
            count,
          },
        ]
      )
    }),
  ]
}

const HostLabelsFilter = props => {
  const { testIdPrefix, itemsProps, itemProps, nodesById, ...rest } = {
    ...checkboxesDefaultProps,
    ...props,
  }

  const chart = useChart()
  const selected = useAttributeValue("selectedNodeLabelsFilter")

  const setSelected = chart.updateNodeLabelsFilter
  const options = useOptions(nodesById)

  useUpdateEffect(() => {
    if (!options.length || !selected.length) return

    setSelected(prev =>
      prev.filter(sel => options.some(option => option.children.some(child => child.value === sel)))
    )
  }, [options.length, setSelected])

  const onSelect = useCallback(
    ({ value, checked }) => {
      setSelected((prev = []) => {
        if (Array.isArray(value)) {
          return checked ? [...new Set([...prev, ...value])] : difference(prev, value)
        }
        return checked ? [...prev, value] : prev.filter(sel => sel !== value)
      })
    },
    [setSelected]
  )

  const items = useMemo(
    () =>
      buildItems({
        options,
        selected,
        itemsProps,
      }),
    [selected, setSelected, options]
  )

  if (!options.length) return null

  return (
    <FilterGroup title="Host labels" setSelected={setSelected} param="selectedNodeLabelsFilter">
      <CheckboxesContainer
        data-testid={`${testIdPrefix}-filter-selections"`}
        searchMargin={[0, 0, 1]}
        items={items}
        onItemClick={onSelect}
        value={selected}
        data-value={selected.join(",") || "all-selected"}
        hasSearch={options.length > 3}
        itemProps={{
          testIdPrefix,
          ...itemProps,
        }}
        {...rest}
      />
    </FilterGroup>
  )
}

export default HostLabelsFilter
