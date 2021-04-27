import { camelizeKeys } from "@/helpers/objectTransform"
import makeNode from "./makeNode"
import initialChartAttributes from "./initialChartAttributes"
import initialPayload from "./initialPayload"

export default ({ sdk, parent, attributes } = {}) => {
  const node = makeNode(sdk, parent, { ...initialChartAttributes, ...attributes })
  let ui = null
  let payload = initialPayload

  const getPayload = () => payload

  const doneFetch = payload => {
    payload = { ...initialPayload, ...camelizeKeys(payload) }
    node.updateAttributes({ loaded: true, loading: false })
  }

  const getUi = ui
  const setUi = newUi => {
    ui = newUi
  }

  return { ...node, type: "chart", getUi, setUi, getPayload, doneFetch }
}
