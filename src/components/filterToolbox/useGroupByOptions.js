import { useCallback } from "react"
import useInstanceIdentities from "@/components/instanceIdentity/useInstanceIdentities"
import { getStats } from "./utils"

const childProps = { unique: "-", disabled: "hidden" }

const groupProps = {
  contribution: "-",
  anomalyRate: "-",
  alerts: "-",
  min: "-",
  avg: "-",
  max: "-",
}

const useGroupByOptions = (chart, { defaultItems, groupBy, groupByLabel }) => {
  const getIdentityProps = useInstanceIdentities()

  return useCallback(() => {
    const attributes = chart.getAttributes()
    const instanceKeys = new Map(
      Object.entries(attributes.instances || {}).map(([key, instance]) => [instance, key])
    )
    const instanceChildProps = {
      ...childProps,
      getProps: instance => getIdentityProps(instanceKeys.get(instance)),
    }

    const defaultOptions = defaultItems.map(item =>
      getStats(chart, item, {
        key: "group-by",
        childrenKey: "label",
        props: { ...groupProps, selected: groupBy.includes(item.id), expandKey: item.expandKey },
        childProps: item.key === "instances" ? instanceChildProps : childProps,
        children: attributes[item.key] ? Object.values(attributes[item.key]) : [],
      })
    )

    const labelOptions = Object.keys(attributes.labels).map(id =>
      getStats(chart, attributes.labels[id], {
        key: "group-by",
        childrenKey: "label",
        props: {
          getLabel: obj => `label: ${obj.nm || id || obj.id}`,
          isLabel: true,
          selected: groupByLabel.includes(id),
        },
        childProps: { ...childProps, rowTarget: { kind: "label", labelKey: id } },
        children: attributes.labels[id].vl,
      })
    )

    return [...defaultOptions, ...labelOptions]
  }, [chart, defaultItems, groupBy, groupByLabel, getIdentityProps])
}

export default useGroupByOptions
