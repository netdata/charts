import { camelizeKeys } from "@/helpers/objectTransform"
import makeNode from "./makeNode"
import initialChartAttributes from "./initialChartAttributes"
import initialPayload from "./initialPayload"

export default ({ sdk, parent, attributes } = {}) => {
  const node = makeNode(sdk, parent, { ...initialChartAttributes, ...attributes })
  let ui = null
  let payload = initialPayload

  const getPayload = () => payload

  const doneFetch = nextPayload => {
    payload = { ...initialPayload, ...camelizeKeys(nextPayload) }
    node.updateAttributes({ loaded: true, loading: false })
  }

  const getUI = () => ui
  const setUI = newUi => {
    ui = newUi
  }

  return { ...node, type: "chart", getUI, setUI, getPayload, doneFetch }
}
